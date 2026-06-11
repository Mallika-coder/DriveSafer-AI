# FleetMind AI

An AI-powered fleet intelligence platform for real-time driver safety monitoring. Combines on-device computer vision (17 ML modules), temporal transformers, federated learning, and conversational AI — all running in the browser at 30+ FPS.

**Live Demo:** https://drive-safer-ai.vercel.app
**GitHub:** https://github.com/Mallika-coder/DriveSafer-AI

## What's Real vs Simulated

| Component | Status |
|-----------|--------|
| Webcam drowsiness detection (EAR, MAR, PERCLOS, head pose, gaze) | **REAL** — runs on YOUR face |
| TinyML + Temporal Transformer inference | **REAL** — sub-0.1ms on-device |
| Talking vs yawning discrimination | **REAL** — frequency analysis on live MAR |
| Phone detection (any angle) | **REAL** — COCO-SSD on webcam feed |
| AI Chat responses | **REAL** — LLM API with live fleet context |
| Your risk score in fleet dashboard | **REAL** — from your webcam session |
| Predictive fatigue (minutes to drowsiness) | **REAL** — computed from your score trend |
| Other 4 fleet drivers | **SIMULATED** — realistic behavior patterns for demo |
| Federated learning rounds | **SIMULATION** — demonstrates algorithm, not cross-device |

## Platform Pages (8)

| Page | What it does |
|------|-------------|
| **Command Center** `/` | Fleet KPIs, live map with vehicle dots, real-time alert feed |
| **Live Monitor** `/monitor` | YOUR webcam → full 17-module ML pipeline running |
| **Fleet Map** `/fleet` | Vehicle tracking + predictive fatigue + anomaly detection |
| **Analytics** `/analytics` | Risk trends, alert charts, interactive federated learning |
| **AI Chat** `/chat` | Real LLM-powered fleet queries with live data context |
| **Drivers** `/drivers` | Interactive table with actions (alert, track, call) |
| **History** `/history` | Session records with event drill-down |
| **Settings** `/settings` | Driver profile, weekly risk heatmap |

## ML Architecture (17 Modules)

```
Camera (30fps) → MediaPipe FaceMesh (468 landmarks) + COCO-SSD
        │
        ├── EAR Calculator (eye closure)
        ├── MAR Calculator (mouth opening)
        ├── Head Pose Estimator (3D pitch/yaw/roll)
        ├── Gaze Direction (iris tracking)
        │
        ├── Blink Detector (rate, duration, PERCLOS)
        ├── Gaze Stability Tracker (variance analysis)
        ├── Talking Detector (frequency: >2.5Hz talk vs <1.5Hz yawn)
        ├── Cognitive Load Detector (fixated gaze, no scanning)
        ├── Audio Fatigue Detector (voice analysis via microphone)
        ├── Driver Adaptation Engine (eye type, glasses, drift correction)
        │
        ├── Drowsiness Fusion Model (7-signal weighted ensemble)
        ├── TinyML Classifier (3-layer MLP, sub-0.1ms)
        ├── Temporal Transformer (30-frame self-attention)
        ├── Adaptive Calibration (baseline ± 2σ)
        │
        ├── Predictive Fatigue (trend + circadian + duration)
        ├── Anomaly Detector (Welford's Z-score)
        ├── Federated Learning (FedAvg + differential privacy)
        └── LLM Driving Coach (NLG + real LLM API)
```

## Key Algorithms

### Multi-Signal Fusion
```
Score = 0.30×PERCLOS + 0.20×EAR + 0.15×BlinkDuration + 0.10×MAR
      + 0.10×HeadPitch + 0.08×BlinkRate + 0.07×GazeStability
```

### Temporal Transformer
```
Input(30×7) → Linear(7→16) → Self-Attention(Q,K,V) → Residual → AvgPool → FFN(16→32→4) → Softmax
```

### Talking vs Yawning
| | Yawning | Talking |
|---|---|---|
| Frequency | <1.5 Hz | >2.5 Hz |
| Amplitude | >0.15 | <0.25 |
| Peak MAR | >2.2× baseline | <2.2× baseline |

### Adaptive Calibration
```
threshold = user_baseline - 2 × standard_deviation
```
Handles narrow eyes (EAR ~0.20), average (~0.26), wide (~0.32).

### Federated Learning
FedAvg aggregation with Gaussian noise (differential privacy). Privacy budget tracked per round. 5 simulated drivers with distinct fatigue profiles.

### Anomaly Detection
Welford's online algorithm for numerically stable running mean/variance. Per-feature Z-score (threshold: 2.5σ) + combined Mahalanobis distance.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite 7 |
| ML Models | Custom MLP + Transformer (vanilla TS, no deps) |
| Face Detection | MediaPipe FaceMesh (468 landmarks + iris) |
| Object Detection | TensorFlow.js COCO-SSD |
| Audio Analysis | Web Audio API (autocorrelation pitch detection) |
| Visualization | HTML5 Canvas + Recharts |
| AI Chat | Real LLM API with fleet context injection |
| Backend | FastAPI + SQLAlchemy + SQLite |
| Real-time | WebSocket |
| Deployment | Vercel |
| Design | Dark theme, Inter + JetBrains Mono, indigo accent |

## Setup

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

## Team & Contributions

| Contributor | Role | Key Deliverables |
|------------|------|-----------------|
| **[Mallika-coder](https://github.com/Mallika-coder)** | ML Pipeline & Architecture | Drowsiness fusion, temporal transformer, TinyML, federated learning, calibration, XAI, pipeline integration |
| **[SimplyHarsh33](https://github.com/SimplyHarsh33)** | Frontend & UI/UX | Layout system, canvas visualizations, driving scene, pages, design system |
| **[jivit-kumar](https://github.com/jivit-kumar)** | Computer Vision | Head pose, gaze tracking, EAR/MAR, FaceMesh/COCO-SSD hooks, LLM coach |
| **[Divyanshu64](https://github.com/Divyanshu64)** | Signal Processing | Talking detector, cognitive load, audio fatigue, anomaly detection, analytics |
| **[hemant-pal164](https://github.com/hemant-pal164)** | Backend & Data | FastAPI, WebSocket, database, session management, drivers page |

## Project Structure
```
├── frontend/src/
│   ├── components/    (11) Layout, WebcamFeed, DrivingScene, Gauges, Charts, XAI, A/B
│   ├── pages/         (9)  CommandCenter, Monitor, Fleet, Analytics, Chat, Drivers, History, Settings
│   ├── utils/         (17) All ML modules — fusion, transformer, FL, anomaly, audio, etc.
│   └── hooks/         (3)  useFaceMesh, useObjectDetect, useAlertSound
├── backend/
│   ├── routers/       Sessions, Events, WebSocket, Analytics
│   ├── services/      Face analyzer, Alert manager
│   └── database/      SQLAlchemy models
└── FleetMind_Interview_Prep.md
```
