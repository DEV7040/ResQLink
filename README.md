# ResQLink — Offline-First Emergency Assistant for Low-Connectivity Disaster Areas

**AITHON 2.0 Finale Project — Team Offgrid**
*SNJB's Late Sau KBJ College of Engineering, Chandwad*

---

## 1. Project Overview & Problem Statement
When floods, earthquakes, or cyclones hit, mobile cellular networks fail first. People lose first-aid guidance, shelter locations, and any way to call for help exactly when they need it most.

**ResQLink** is an installable, offline-first Progressive Web Application (PWA). An on-device AI agent answers verified NDMA/IFRC first-aid questions, shows shelters on an offline cached map, and relays SOS messages phone-to-phone over a WebRTC mesh until one device reaches emergency responders. Zero special hardware required.

---

## 2. Core AI & Technical Architecture

```
+-----------------------------------+
|     User Phone (Offline PWA)      |
|  - AI Agent Router                |
|  - On-Device RAG Q&A (NDMA/IFRC)  |
|  - Cached Leaflet Map             |
|  - IndexedDB Local SOS Queue      |
+-----------------------------------+
                 |
                 v
+-----------------------------------+
|      P2P WebRTC Mesh Relay        |
|  - WebRTC Hops: Phone A -> B      |
+-----------------------------------+
                 |
                 v (When any device reaches signal)
+-----------------------------------+
|         FastAPI Backend           |
|  - REST Ingestion & Deduplication |
|  - Geo-Fenced Alert Engine        |
|  - Resource & Incident Store      |
+-----------------------------------+
                 |
                 v
+-----------------------------------+
|        Responder Dashboard        |
|  - Live Map of Prioritized SOS    |
|  - Triage (Police, Medical, NDRF) |
+-----------------------------------+
```

---

## 3. Technology Stack

- **Frontend:** React 18, Vite, Workbox / Custom PWA Service Worker, IndexedDB.
- **Offline AI & Triage:** Intent Router, Semantic Cosine Vector Retrieval over NDMA & IFRC protocols.
- **Languages Supported:** English, Hindi (हिंदी), and Marathi (मराठी) with Web Speech Recognition.
- **Maps:** Leaflet, React-Leaflet, OpenStreetMap with on-device Haversine distance math.
- **Mesh Relay:** WebRTC DataChannel phone-to-phone relay simulation.
- **Backend:** Python, FastAPI, Uvicorn, JSON thread-safe atomic datastore.

---

## 4. How to Run on Windows PowerShell

### Step 1: Start the Backend (Terminal 1)
```powershell
cd C:\Users\gd775\.gemini\antigravity\scratch\ResQLink\backend
python -m uvicorn app:app --host 127.0.0.1 --port 8000 --reload
```
*Backend URL:* **http://127.0.0.1:8000**
*Swagger API Docs:* **http://127.0.0.1:8000/docs**

### Step 2: Start the Frontend (Terminal 2)
```powershell
cd C:\Users\gd775\.gemini\antigravity\scratch\ResQLink\frontend
npm run dev
```
*Frontend App:* **http://localhost:5173**

---

## 5. 60-Second Live Demo Flow for Judges (AITHON 2.0 Slide 7)

1. **Load app once online:** Open `http://localhost:5173`.
2. **Switch to airplane mode:** Click **"Simulate Offline"** in the top navigation bar.
3. **Voice & Multilingual RAG:**
   - Select **हिंदी** or **मराठी**.
   - Speak or type: *"बाढ़ का पानी घर में आ गया"* or *"Where is the nearest shelter?"*.
   - Watch the **AI Agent Router** identify the intent and display NDMA emergency protocols on-device.
4. **Open Offline Map:** View the nearest shelter with mathematically calculated distance in km.
5. **Send SOS from Phone A & Relay via Phone B:**
   - Click **Mesh Relay (P2P)**.
   - Click **"Simulate 1-Click Hop (Phone A -> Phone B)"**.
6. **Responder Dashboard Sync:**
   - Toggle Offline: OFF &rarr; Click **"Sync to Backend"**.
   - Open **"Responder Portal"** in the top header to see the prioritized SOS marked with **"Relayed via WebRTC Mesh"**!
