import { EMERGENCY_TOPICS } from "../data/emergencyData";
import { SAMPLE_HELP_POINTS } from "../data/emergencyData";
import { calculateDistanceKm } from "./location";

const SOS_INTENT_KEYWORDS = [
  "save me", "help me", "sos", "trapped", "drowning", "dying", "collapsed", "under rubble",
  "bleeding heavily", "unconscious", "heart attack", "can't breathe", "fire trapped", "urgent rescue",
  "बचाओ", "मदद करो", "फंस गए", "डूब रहे", "सांस नहीं आ रही", "मलबे में", "खून बह रहा", "आग लगी है", "तुरंत मदद",
  "वाचवा", "मदत करा", "अडकलो", "बुडत आहे", "श्वास घेता येत नाही", "रक्तस्त्राव", "आग लागली", "तातडीने"
];

const MAP_INTENT_KEYWORDS = [
  "shelter", "camp", "hospital", "where to go", "safe place", "relief camp", "find route", "location", "nearest",
  "आश्रय", "राहत शिविर", "कहा जाऊ", "सुरक्षित जगह", "अस्पताल", "पास का कैंप", "नक्शा", "रास्ता",
  "निवारा", "छावणी", "कुठे जाऊ", "सुरक्षित जागा", "दवाखाना", "जवळचे", "नकाशा"
];

function createVector(text) {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s\u0900-\u097F]/gi, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);

  const freq = {};
  for (const w of words) {
    freq[w] = (freq[w] || 0) + 1;
  }
  return freq;
}

function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const key in vecA) {
    normA += vecA[key] * vecA[key];
    if (vecB[key]) {
      dotProduct += vecA[key] * vecB[key];
    }
  }

  for (const key in vecB) {
    normB += vecB[key] * vecB[key];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function routeUserIntent(query, userLocation = null) {
  if (!query || !query.trim()) {
    return { intent: "UNKNOWN", text: "Please provide a query." };
  }

  const q = query.toLowerCase().trim();

  const isSOS = SOS_INTENT_KEYWORDS.some((kw) => q.includes(kw));
  if (isSOS) {
    return {
      intent: "TRIGGER_SOS",
      confidence: 0.96,
      reason: "High-urgency distress language detected.",
      suggestedEmergency: q.includes("fire") || q.includes("आग")
        ? "Fire / Smoke Trapped"
        : q.includes("water") || q.includes("drown") || q.includes("बाढ़") || q.includes("पाणी")
        ? "Flood / Water Trap"
        : q.includes("rubble") || q.includes("मलबा")
        ? "Structural Collapse"
        : "Medical Trauma",
      query
    };
  }

  const isMap = MAP_INTENT_KEYWORDS.some((kw) => q.includes(kw));
  if (isMap) {
    let nearest = SAMPLE_HELP_POINTS[0];
    let minDistance = 9999;

    if (userLocation) {
      SAMPLE_HELP_POINTS.forEach((sp) => {
        const lat = userLocation.latitude + sp.offsetLat;
        const lng = userLocation.longitude + sp.offsetLng;
        const dist = calculateDistanceKm(userLocation.latitude, userLocation.longitude, lat, lng);
        if (dist !== null && dist < minDistance) {
          minDistance = dist;
          nearest = { ...sp, calculatedDist: dist, lat, lng };
        }
      });
    }

    return {
      intent: "SHOW_MAP",
      confidence: 0.92,
      reason: "Shelter / safe zone location request identified.",
      nearestShelter: nearest,
      query
    };
  }

  const ragResult = retrieveNDMAGuidance(query);
  return {
    intent: "ANSWER",
    confidence: ragResult.score > 0 ? 0.88 : 0.45,
    ragData: ragResult,
    query
  };
}

export function retrieveNDMAGuidance(query) {
  const queryVec = createVector(query);
  let bestTopic = null;
  let highestScore = -1;

  for (const topic of EMERGENCY_TOPICS) {
    const docText = `${topic.title} ${topic.summary} ${topic.keywords.join(" ")} ${topic.quickActions.join(" ")} ${topic.dos.join(" ")} ${topic.donts.join(" ")}`;
    const docVec = createVector(docText);

    const score = cosineSimilarity(queryVec, docVec);
    if (score > highestScore) {
      highestScore = score;
      bestTopic = topic;
    }
  }

  return {
    topic: bestTopic,
    score: Math.round(highestScore * 100) / 100,
    source: "NDMA National Disaster Guidelines & IFRC First Aid Standards (2020)"
  };
}
