export const EMERGENCY_DISCLAIMER = 
  "DISCLAIMER: This offline assistant provides verified general emergency protocols and triage principles from NDMA and IFRC standards. " +
  "It is a rule-based offline tool, NOT a diagnostic medical professional. " +
  "If mobile cellular networks or satellite dispatch are accessible, call official emergency services (112 / 911) immediately.";

export const EMERGENCY_CONTACTS = [
  {
    name: "Unified Emergency (India)",
    number: "112",
    description: "National Emergency Response Support System (Police, Fire, Ambulance, Disaster)",
    category: "Unified",
    icon: "PhoneCall",
    badge: "24/7 Primary"
  },
  {
    name: "Ambulance / Emergency Medical",
    number: "108",
    description: "Emergency Medical Services & Disaster Ambulance (Universal: 102/108)",
    category: "Medical",
    icon: "Activity",
    badge: "Medical"
  },
  {
    name: "Fire Rescue Service",
    number: "101",
    description: "Fire Hazards, Hazmat, and Urban Search & Rescue",
    category: "Fire",
    icon: "Flame",
    badge: "Rescue"
  },
  {
    name: "Police Emergency",
    number: "100",
    description: "Public Safety, Law Enforcement & Search Assistance",
    category: "Police",
    icon: "ShieldAlert",
    badge: "Security"
  },
  {
    name: "NDRF Disaster Relief",
    number: "1078",
    description: "National Disaster Response Force Control Room",
    category: "Disaster",
    icon: "LifeBuoy",
    badge: "Disaster"
  },
  {
    name: "State Emergency Ops (SEOC)",
    number: "1070",
    description: "State-level Disaster Management Control",
    category: "Disaster",
    icon: "Radio",
    badge: "State"
  },
  {
    name: "District Disaster Control",
    number: "1077",
    description: "District Collectorate Emergency Cell & Evacuation Logistics",
    category: "Disaster",
    icon: "Home",
    badge: "District"
  },
  {
    name: "Women Helpline",
    number: "1091",
    description: "Emergency rescue, protection and psychological support",
    category: "Support",
    icon: "HeartHandshake",
    badge: "Helpline"
  }
];

export const EMERGENCY_TOPICS = [
  {
    id: "floods",
    title: "Floods & Flash Floods",
    category: "Natural Disaster",
    severity: "High",
    icon: "Waves",
    summary: "Immediate action for rising waters, flash floods, and building inundation.",
    keywords: ["flood", "water", "drown", "river", "rain", "submerged", "dam", "overflow", "flash flood", "बाढ़", "पूर"],
    quickActions: [
      "Move immediately to the highest floor or roof. Never hide in a sealed attic without a roof exit.",
      "Turn off main electrical breaker and gas valve ONLY if standing in completely dry area.",
      "Never walk, swim, or drive through floodwaters. 15 cm of moving water knocks you down; 30 cm sweeps away cars.",
      "Avoid contact with floodwater: risk of raw sewage, chemicals, sharp debris, and live submerged power cables."
    ],
    detailedSteps: [
      {
        step: 1,
        heading: "Secure Position & Evacuate Low Ground",
        content: "If water begins entering your structure, do not attempt to salvage belongings. Collect your emergency Go-Bag, medications, and charge cables. Evacuate to higher elevated ground along designated routes."
      },
      {
        step: 2,
        heading: "If Trapped Inside a Structure",
        content: "Proceed to the top level or roof. Take a flashlight, bright cloth, or mirror to signal rescue helicopters and boats. Do not venture into closed attics where water can trap you against the ceiling."
      },
      {
        step: 3,
        heading: "Water Safety & Sanitation",
        content: "Never drink tap or flood water after flooding until officially cleared. Boil water vigorously for at least 1 minute or use purification tablets."
      }
    ],
    dos: [
      "Listen to battery-operated radio for emergency weather bulletins.",
      "Signal rescuers using SOS light pattern (3 short, 3 long, 3 short) with flashlight.",
      "Keep phone on battery saver mode and communicate primarily via SMS."
    ],
    donts: [
      "Do NOT drive past barricades or flooded underpasses.",
      "Do NOT touch electrical equipment while wet or standing in water.",
      "Do NOT walk near riverbanks or drainage channels."
    ]
  },
  {
    id: "earthquakes",
    title: "Earthquakes & Structural Tremors",
    category: "Natural Disaster",
    severity: "Critical",
    icon: "Activity",
    summary: "Drop, Cover, and Hold On. Crucial actions during violent tremors and aftershocks.",
    keywords: ["earthquake", "quake", "tremor", "shaking", "collapse", "rubble", "aftershock", "भूकंप"],
    quickActions: [
      "DROP down onto hands and knees immediately.",
      "COVER head and neck under a sturdy table, desk, or against an interior wall.",
      "HOLD ON until the shaking completely stops.",
      "Do NOT run outside while shaking is active. Falling glass and facade debris cause most casualties."
    ],
    detailedSteps: [
      {
        step: 1,
        heading: "Immediate Survival (Inside a Building)",
        content: "Stay where you are. Drop under heavy furniture. Protect your head with your arms or a pillow. Stay away from glass windows, exterior doors, and heavy light fixtures. Never enter an elevator."
      },
      {
        step: 2,
        heading: "Survival (Outdoors or Driving)",
        content: "If outdoors, move to an open clearing away from buildings, power lines, billboards, and streetlamps. If driving, pull safely to the shoulder away from overpasses, bridges, and electric poles."
      },
      {
        step: 3,
        heading: "If Trapped in Rubble",
        content: "Do not strike matches or lighters due to gas line rupture risks. Cover your mouth and nose with cloth. Tap rhythmically on a metal pipe or concrete wall (rescuers use acoustic listening devices). Whistle before yelling to conserve air."
      }
    ],
    dos: [
      "Expect aftershocks within minutes, hours, or days.",
      "Check yourself and nearby persons for bleeding and apply pressure immediately.",
      "Check for gas smells: if smelling gas, turn off main cylinder and ventilate without sparking."
    ],
    donts: [
      "Do NOT use elevators under any circumstances.",
      "Do NOT light candles, matches, or operate electrical switches if gas is suspected.",
      "Do NOT rush panic-stricken into stairwells during active shaking."
    ]
  },
  {
    id: "fire",
    title: "Building & Wildfire Hazards",
    category: "Emergency Incident",
    severity: "Critical",
    icon: "Flame",
    summary: "Smoke survival, rapid evacuation paths, and fire suppression protocols.",
    keywords: ["fire", "smoke", "burn", "flame", "wildfire", "extinguisher", "blaze", "suffocation", "आग"],
    quickActions: [
      "Get out and stay out! Do not return inside for personal belongings or pets.",
      "Crawl low under smoke: breathable, cooler air remains 30 to 60 cm above floor level.",
      "Feel closed doors with the BACK of your hand. If hot to touch, do NOT open.",
      "If clothing catches fire: STOP, DROP to the ground, and ROLL until flames are extinguished."
    ],
    detailedSteps: [
      {
        step: 1,
        heading: "Evacuation Protocol",
        content: "Sound the alarm and alert building occupants. Use secondary escape routes if primary corridor is filled with heat or smoke. Close doors behind you as you escape to slow fire spread."
      },
      {
        step: 2,
        heading: "If Trapped in a Smoke-Filled Room",
        content: "Close the door. Seal cracks and vents around the door with wet towels, blankets, or duct tape. Open a window slightly for ventilation if clear air exists outside. Hang a brightly colored cloth or sheet out the window to signal firefighters."
      },
      {
        step: 3,
        heading: "Fire Extinguisher PASS Technique",
        content: "P: Pull safety pin. A: Aim nozzle at base of the fire (not flames). S: Squeeze trigger handle smoothly. S: Sweep side-to-side along base until fire is completely smothered."
      }
    ],
    dos: [
      "Cover mouth and nose with a damp cloth if smoke is present.",
      "Assemble at a predetermined safe muster point away from structures.",
      "Call emergency dispatch (112 / 101) immediately upon reaching safety."
    ],
    donts: [
      "Do NOT use elevators during a fire.",
      "Do NOT open a warm door—it can trigger an explosive backdraft.",
      "Do NOT attempt to fight a fire that is taller than yourself."
    ]
  },
  {
    id: "cyclones",
    title: "Cyclones, Typhoons & Storm Surges",
    category: "Natural Disaster",
    severity: "High",
    icon: "Wind",
    summary: "Protection against gale-force winds, flying projectiles, and sudden storm surges.",
    keywords: ["cyclone", "typhoon", "hurricane", "wind", "storm", "gale", "surge", "weather", "तूफान"],
    quickActions: [
      "Secure or bring indoors all loose outdoor furniture, signs, and metal sheets.",
      "Tape or shutter glass windows; stay inside an interior windowless room or corridor.",
      "Store at least 5 days of drinking water and non-perishable food.",
      "Beware the 'Eye of the Storm': do not leave shelter when winds temporarily cease."
    ],
    detailedSteps: [
      {
        step: 1,
        heading: "Pre-Landfall Preparation",
        content: "Charge all mobile phones, power banks, and battery lights. Disconnect non-essential electrical appliances. Ensure vehicle fuel tanks are full in case of mandatory evacuation."
      },
      {
        step: 2,
        heading: "During Peak Cyclone Landfall",
        content: "Remain in the reinforced interior section of the building. Keep away from glass panes and corrugated asbestos/tin roofs. If the roof begins lifting, seek shelter under heavy wooden tables or mattresses."
      },
      {
        step: 3,
        heading: "Post-Storm Hazard Recognition",
        content: "Beware fallen live electrical lines, weakened masonry, uprooted trees, and contaminated municipal water pipelines."
      }
    ],
    dos: [
      "Inspect roof anchors and drainage gutters prior to storm arrival.",
      "Keep official emergency radio broadcast on low volume to monitor cyclone trajectory.",
      "Keep vital identification papers sealed in zip-lock waterproof bags."
    ],
    donts: [
      "Do NOT venture outdoors during the calm 'eye' of the storm—the second half winds hit violently in reverse.",
      "Do NOT touch dangling power lines or metal fences touching wires.",
      "Do NOT visit coastal beaches or riverfronts to watch waves."
    ]
  },
  {
    id: "firstaid",
    title: "Essential First-Aid & Trauma Triage",
    category: "Medical Guidance",
    severity: "Critical",
    icon: "HeartPulse",
    summary: "Field stabilization for severe bleeding, cardiac arrest, choking, burns, and fractures.",
    keywords: ["first aid", "bleeding", "cpr", "choking", "burn", "fracture", "wound", "heart attack", "unconscious", "प्राथमिक चिकित्सा", "प्रथमोपचार"],
    quickActions: [
      "Bleeding: Apply direct continuous pressure with clean cloth for 10 full minutes.",
      "CPR: Push hard & fast in center of chest (100-120 bpm, 5 cm deep) until medical arrival.",
      "Choking: 5 back blows between shoulder blades followed by 5 abdominal Heimlich thrusts.",
      "Burns: Cool immediately under clean running water for 15-20 mins. Never use ice or butter."
    ],
    detailedSteps: [
      {
        step: 1,
        heading: "Hands-Only CPR for Unresponsive Victim",
        content: "Check if person is breathing. If not breathing or only gasping: Call 112/108. Place the heel of one hand in center of victim's chest, interlock other hand on top. Push hard and fast at 100-120 beats/min (to rhythm of 'Stayin Alive'). Allow full chest recoil. Do not stop until professional medics arrive."
      },
      {
        step: 2,
        heading: "Severe Arterial Bleeding Control",
        content: "Place clean gauze or cloth over wound and apply heavy, continuous two-handed pressure. If soaked through, DO NOT remove original cloth; add more layers on top. If bleeding from limb cannot be stopped and is life-threatening, apply a tourniquet 5-7 cm above wound (note precise time applied)."
      },
      {
        step: 3,
        heading: "Heatstroke vs Heat Exhaustion",
        content: "Heatstroke signs: Hot, dry or red skin, confusion, rapid bounding pulse, temperature above 40°C. Immediate action: Move to shade, spray or sponge with cool water, fan vigorously, place ice packs or cold wet towels under armpits and groin. Seek emergency medical care immediately."
      },
      {
        step: 4,
        heading: "Fracture Stabilization",
        content: "Do not attempt to push exposed bones back or straighten crooked limbs. Splint the limb above and below the fractured joint using folded cardboard, wood, or rolled newspaper wrapped with cloth to prevent movement."
      }
    ],
    dos: [
      "Always ensure your own safety before approaching an injured person.",
      "Keep injured victims warm and calm to prevent traumatic shock.",
      "Wear protective gloves or improvised barrier when handling blood."
    ],
    donts: [
      "Do NOT give food or water to an unconscious or drowsy person (choking hazard).",
      "Do NOT apply ice, oil, turmeric, or butter to burns (leads to infection and tissue damage).",
      "Do NOT move a patient suspected of having a spinal or neck injury unless in immediate fire danger."
    ]
  },
  {
    id: "evacuation",
    title: "Evacuation Protocol & Safe Shelters",
    category: "Logistics",
    severity: "Medium",
    icon: "MapPin",
    summary: "Step-by-step guidelines for rapid family evacuation, route planning, and shelter intake.",
    keywords: ["evacuate", "shelter", "camp", "leave", "bag", "supplies", "route", "displacement", "आश्रय", "निवारा"],
    quickActions: [
      "Follow official evacuation orders without hesitation.",
      "Take your pre-packed 72-Hour Emergency Go-Bag and essential prescription medicines.",
      "Leave a prominent note on your front door stating evacuation date, time, and destination.",
      "Lock doors and windows; shut off main utility breakers if time permits."
    ],
    detailedSteps: [
      {
        step: 1,
        heading: "Emergency 72-Hour Go-Bag Packing",
        content: "Pack 3 liters of water per person per day, non-perishable calorie-dense food (nuts, dry rations), compact first-aid kit, waterproof flashlight, whistle, duplicate identity documents in zip bag, manual can opener, spare cash, and emergency blankets."
      },
      {
        step: 2,
        heading: "Movement and Route Selection",
        content: "Use designated civic evacuation routes. Avoid shortcuts through valleys, ravines, canyons, or underpasses susceptible to sudden flooding or mudslides. Keep headlights on low beam in fog/heavy rain."
      },
      {
        step: 3,
        heading: "Shelter Arrival & Registration",
        content: "Report to the relief shelter desk immediately for head-count and emergency tracing. Inform shelter medical staff of critical chronic conditions (diabetes, dialysis, asthma) or special needs."
      }
    ],
    dos: [
      "Keep family members together and designate an out-of-area relative as central check-in contact.",
      "Wear sturdy shoes and long pants to protect against debris and broken glass.",
      "Help elderly and mobility-impaired neighbors evacuate safely."
    ],
    donts: [
      "Do NOT return to the evacuation zone until civic authorities officially declare it safe.",
      "Do NOT overload vehicles with non-essential heavy possessions.",
      "Do NOT rely on vehicle GPS routing in disaster areas without local verification."
    ]
  },
  {
    id: "water_sanitation",
    title: "Emergency Water Purification & Sanitation",
    category: "Survival",
    severity: "Medium",
    icon: "Droplets",
    summary: "Making contaminated water safe to drink and basic sanitation in disaster zones.",
    keywords: ["water", "purify", "boil", "sanitation", "bleach", "infection", "hygiene", "cholera", "पानी"],
    quickActions: [
      "Boil water vigorously for a rolling 1 full minute (3 minutes at high altitudes).",
      "If boiling is impossible, add 2 drops of standard unscented 6% household bleach per 1 liter of clear water. Stir and wait 30 minutes.",
      "If water is cloudy, filter through clean cloth or let sediment settle before boiling or bleaching.",
      "Never drink flood water, radiator water, or flood-inundated well water untreated."
    ],
    detailedSteps: [
      {
        step: 1,
        heading: "Sediment Filtration",
        content: "Pour turbid water through layers of clean tightly-woven cotton cloth, coffee filters, or paper towels into a clean vessel to remove suspended silt and parasite eggs."
      },
      {
        step: 2,
        heading: "Disinfection Methods",
        content: "Boiling is the most reliable method to kill pathogenic bacteria, viruses, and protozoa. For chemical treatment: Use Chlorine dioxide tablets or unscented sodium hypochlorite bleach (2 drops/liter). Water should have a very slight chlorine odor after 30 minutes; if not, repeat dose and wait another 15 minutes."
      },
      {
        step: 3,
        heading: "Field Sanitation & Waste Disposal",
        content: "Bury human waste at least 60 meters (200 feet) away from any surface water source, wells, or food prep zones, in a cat-hole 15 to 20 cm deep. Cover thoroughly with topsoil."
      }
    ],
    dos: [
      "Store treated water in sealed, clean, food-grade containers.",
      "Wash hands or use alcohol sanitizer before eating and after handling waste.",
      "Keep water storage containers out of direct intense sunlight once treated."
    ],
    donts: [
      "Do NOT use scented bleach, color-safe bleach, or pool shock chemicals for drinking water.",
      "Do NOT drink floodwater even if filtered—chemical and petroleum contaminants cannot be boiled away.",
      "Do NOT reuse unwashed vessels that previously held contaminated water."
    ]
  }
];

export const SAMPLE_HELP_POINTS = [
  {
    id: "help-1",
    name: "Simulated Relief Camp Alpha (Civil Defense)",
    type: "Major Shelter",
    distanceKm: 1.2,
    offsetLat: 0.0085,
    offsetLng: 0.0072,
    services: ["Emergency Triage", "Clean Water Tank", "Rations", "Satellite Relay"],
    capacity: "450 Persons",
    status: "Active Camp",
    badgeColor: "emerald",
    isSimulated: true
  },
  {
    id: "help-2",
    name: "Simulated Mobile Medical Unit Beta (Red Cross)",
    type: "Medical Post",
    distanceKm: 2.1,
    offsetLat: -0.0120,
    offsetLng: 0.0095,
    services: ["Trauma Stabilization", "Ambulance Staging", "Burn Treatment", "IV Fluids"],
    capacity: "Emergency Triage Only",
    status: "High Readiness",
    badgeColor: "red",
    isSimulated: true
  },
  {
    id: "help-3",
    name: "Simulated Water & Ration Distribution Hub",
    type: "Supply Depot",
    distanceKm: 2.8,
    offsetLat: 0.0145,
    offsetLng: -0.0110,
    services: ["Purified Water", "Baby Food", "Emergency Blankets", "Hygiene Kits"],
    capacity: "Supply Depot",
    status: "Stock Available",
    badgeColor: "blue",
    isSimulated: true
  },
  {
    id: "help-4",
    name: "Simulated High-Ground Safe Haven (Community Center)",
    type: "Evacuation Center",
    distanceKm: 3.5,
    offsetLat: -0.0095,
    offsetLng: -0.0160,
    services: ["High Ground (Flood Safe)", "Generator Power", "Community Kitchen", "First Aid"],
    capacity: "600 Persons",
    status: "Open",
    badgeColor: "amber",
    isSimulated: true
  }
];
