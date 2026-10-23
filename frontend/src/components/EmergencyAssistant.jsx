import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  HelpCircle, 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Mic, 
  MicOff, 
  Globe, 
  MapPin, 
  AlertOctagon, 
  ShieldCheck,
  Waves,
  Activity,
  Flame,
  Wind,
  HeartPulse,
  Droplets
} from 'lucide-react';
import { EMERGENCY_TOPICS } from '../data/emergencyData';
import { routeUserIntent } from '../utils/aiRouter';
import { SUPPORTED_LANGUAGES, TRANSLATIONS } from '../data/i18nData';
import { getGPSLocation } from '../utils/location';

const ICON_MAP = {
  Waves,
  Activity,
  Flame,
  Wind,
  HeartPulse,
  MapPin,
  Droplets
};

export default function EmergencyAssistant({ onTriggerSOSFromRouter, onOpenMapFromRouter }) {
  const [currentLang, setCurrentLang] = useState("en");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedTopicId, setExpandedTopicId] = useState(null);
  
  const [questionInput, setQuestionInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [routerResult, setRouterResult] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  useEffect(() => {
    getGPSLocation({ timeout: 5000 }).then((res) => {
      if (res.success && res.coordinates) {
        setUserLocation(res.coordinates);
      }
    });
  }, []);

  const handleVoiceToggle = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    const langObj = SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) || SUPPORTED_LANGUAGES[0];
    recognition.lang = langObj.voiceCode;
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const speechText = event.results[0][0].transcript;
      setQuestionInput(speechText);
      setIsListening(false);
      processQuery(speechText);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const processQuery = (textToProcess) => {
    const query = textToProcess || questionInput;
    if (!query.trim()) return;

    const result = routeUserIntent(query, userLocation);
    setRouterResult(result);

    if (result.intent === "ANSWER" && result.ragData?.topic) {
      setExpandedTopicId(result.ragData.topic.id);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    processQuery(questionInput);
  };

  const filteredTopics = useMemo(() => {
    return EMERGENCY_TOPICS.filter((topic) => {
      const matchesCategory = selectedCategory === "all" || topic.category === selectedCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      return (
        topic.title.toLowerCase().includes(q) ||
        topic.summary.toLowerCase().includes(q) ||
        topic.keywords.some((k) => k.toLowerCase().includes(q)) ||
        topic.quickActions.some((a) => a.toLowerCase().includes(q))
      );
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="assistant-section">
      <div className="assistant-header-box">
        <div className="assistant-badge-row">
          <span className="badge-offline-ready">
            <Sparkles size={14} className="inline-icon text-amber" /> {t.aiRouterTag}
          </span>

          <div className="lang-selector-group">
            <Globe size={14} className="text-muted" />
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                className={`btn-lang-pill ${currentLang === lang.code ? 'lang-active' : ''}`}
                onClick={() => setCurrentLang(lang.code)}
              >
                <span>{lang.flag} {lang.label}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleFormSubmit} className="question-form">
          <div className="question-input-wrapper">
            <HelpCircle size={20} className="question-icon" />
            <input
              type="text"
              className="question-input"
              placeholder={isListening ? t.listeningVoice : t.askVoicePlaceholder}
              value={questionInput}
              onChange={(e) => setQuestionInput(e.target.value)}
            />

            <button
              type="button"
              className={`btn-voice-mic ${isListening ? 'mic-listening' : ''}`}
              onClick={handleVoiceToggle}
              title="Click to speak (Hindi, Marathi, English)"
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              <span className="hide-on-mobile">{isListening ? "Listening..." : t.voiceInputBtn}</span>
            </button>

            <button type="submit" className="btn-question-submit">
              Route Intent
            </button>
          </div>
        </form>

        <div className="quick-suggest-row">
          <span className="text-muted" style={{ fontSize: '0.74rem' }}>Try Asking:</span>
          {[
            currentLang === 'hi' ? "बाढ़ का पानी घर में" : currentLang === 'mr' ? "घरात पाणी शिरले" : "Water rising in home",
            currentLang === 'hi' ? "निकटतम राहत शिविर" : currentLang === 'mr' ? "जवळचे निवारा केंद्र" : "Where is nearest shelter?",
            currentLang === 'hi' ? "मदद करो, मलबे में फंसे हैं" : currentLang === 'mr' ? "मदत करा, अडकलो आहोत" : "Help! We are trapped under rubble",
            "CPR First Aid"
          ].map((q) => (
            <button
              key={q}
              type="button"
              className="suggest-pill"
              onClick={() => {
                setQuestionInput(q);
                processQuery(q);
              }}
            >
              {q}
            </button>
          ))}
        </div>

        {routerResult && (
          <div className={`router-decision-card router-${routerResult.intent.toLowerCase()}`}>
            <div className="router-header">
              <span className="router-intent-badge">
                AI Intent: <strong>{routerResult.intent}</strong> ({(routerResult.confidence * 100).toFixed(0)}% Confidence)
              </span>
              <button type="button" className="btn-toolbar" style={{ padding: '2px 6px' }} onClick={() => setRouterResult(null)}>✕</button>
            </div>

            {routerResult.intent === "TRIGGER_SOS" && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertOctagon size={22} className="text-red" />
                  <h4>{t.intentSOS}: "{routerResult.suggestedEmergency}"</h4>
                </div>
                <p className="text-muted" style={{ fontSize: '0.8rem', margin: '4px 0 8px 0' }}>
                  The AI Router recognized urgent life-safety distress language in your query.
                </p>
                <button
                  type="button"
                  className="btn-danger-large"
                  onClick={() => onTriggerSOSFromRouter && onTriggerSOSFromRouter(routerResult.suggestedEmergency)}
                >
                  Confirm & Broadcast Instant SOS &rarr;
                </button>
              </div>
            )}

            {routerResult.intent === "SHOW_MAP" && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={22} className="text-amber" />
                  <h4>{t.intentMap}</h4>
                </div>
                <p className="text-muted" style={{ fontSize: '0.8rem', margin: '4px 0 8px 0' }}>
                  Nearest Relief Point: <strong>{routerResult.nearestShelter?.name}</strong> 
                  {routerResult.nearestShelter?.calculatedDist != null && ` (${routerResult.nearestShelter.calculatedDist} km away)`}.
                </p>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => onOpenMapFromRouter && onOpenMapFromRouter()}
                >
                  Open Cached GPS Map &rarr;
                </button>
              </div>
            )}

            {routerResult.intent === "ANSWER" && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOpen size={22} className="text-emerald" />
                  <h4>{t.intentAnswer}: {routerResult.ragData?.topic?.title || "Triage Protocol"}</h4>
                </div>
                <p className="text-muted" style={{ fontSize: '0.75rem', margin: '2px 0 6px 0' }}>
                  Retrieved on-device via Semantic Similarity from: <em>{routerResult.ragData?.source}</em>
                </p>
                {routerResult.ragData?.topic && (
                  <ul style={{ paddingLeft: '20px', fontSize: '0.8rem' }}>
                    {routerResult.ragData.topic.quickActions.slice(0, 3).map((act, i) => (
                      <li key={i}>{act}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        <div className="search-input-box" style={{ marginTop: '6px' }}>
          <Search size={16} className="text-muted" />
          <input
            type="text"
            placeholder="Search NDMA / IFRC offline guides (e.g., cpr, burn, quake)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="question-input"
            style={{ fontSize: '0.8rem', paddingLeft: '8px' }}
          />
        </div>
      </div>

      <div className="topics-grid">
        {filteredTopics.map((topic) => {
          const IconComp = ICON_MAP[topic.icon] || ShieldCheck;
          const isExpanded = expandedTopicId === topic.id;

          return (
            <div key={topic.id} className="topic-card">
              <div 
                className="topic-card-header"
                onClick={() => setExpandedTopicId(isExpanded ? null : topic.id)}
              >
                <div className="brand-icon-wrapper" style={{ width: '36px', height: '36px' }}>
                  <IconComp size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '2px' }}>
                    <span className="brand-badge">{topic.category}</span>
                    <span className="text-red" style={{ fontSize: '0.7rem', fontWeight: 700 }}>NDMA / IFRC</span>
                  </div>
                  <h3 className="font-bold">{topic.title}</h3>
                  <p className="text-muted" style={{ fontSize: '0.78rem' }}>{topic.summary}</p>
                </div>
                <div>
                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>

              <div className="quick-actions-box">
                <span className="text-amber" style={{ fontSize: '0.75rem', fontWeight: 700 }}>Immediate Life-Safety Protocol:</span>
                <ul className="quick-actions-list">
                  {topic.quickActions.map((action, i) => (
                    <li key={i}>{action}</li>
                  ))}
                </ul>
              </div>

              {isExpanded && (
                <div style={{ padding: '16px', borderTop: '1px solid var(--border-subtle)', backgroundColor: '#111a2c' }}>
                  <h4 style={{ fontSize: '0.85rem', marginBottom: '8px' }}>Step-by-Step Response Protocol</h4>
                  {topic.detailedSteps.map((step) => (
                    <div key={step.step} style={{ marginBottom: '8px' }}>
                      <h5 style={{ color: 'var(--red-400)' }}>{step.step}. {step.heading}</h5>
                      <p className="text-muted" style={{ fontSize: '0.78rem' }}>{step.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
