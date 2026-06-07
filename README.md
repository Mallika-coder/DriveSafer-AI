# DriveSafe AI

A real-time driver fatigue and distraction detection system using computer vision and multi-signal ML fusion. Processes webcam feeds at 30+ FPS to compute drowsiness risk scores from 7 independent physiological signals.

## ML Pipeline & Algorithms

### Multi-Signal Drowsiness Fusion Model
A weighted ensemble approach combining 7 signals into a composite drowsiness score (0-100):

| Signal | Weight | Method |
|--------|--------|--------|
| **PERCLOS** | 30% | Percentage of eye closure over sliding window — gold-standard fatigue metric from research literature |
| **Eye Aspect Ratio (EAR)** | 20% | Euclidean distance ratio across 6 eye landmarks (Soukupova & Cech, 2016) |
| **Blink Duration** | 15% | Microsleep detection — prolonged closures (>200ms) indicate fatigue |
| **Mouth Aspect Ratio (MAR)** | 10% | Yawn detection via lip landmark geometry |
| **Head Pose (Pitch)** | 10% | Forward nodding detection from 3D pose estimation |
| **Blink Rate** | 8% | Deviation from normal (15 blinks/min) indicates fatigue |
| **Gaze Stability** | 7% | Variance of iris position — erratic gaze correlates with drowsiness |

### Talking vs Yawning Discrimination
Solves a key false-positive problem: mouth opening during speech vs. actual yawning.

| Feature | Yawning | Talking |
|---------|---------|---------|
| MAR frequency | <1.5 Hz (slow open/close) | >2.5 Hz (rapid oscillation) |
| MAR amplitude | >0.15 (wide opening) | <0.25 (small movements) |
| Duration | 2-6s sustained | Intermittent |
| Peak MAR | >2.2x baseline | <2.2x baseline |

### Hands-Free Call Detection (Earphones/Buds)
Detects phone conversations when no phone is visible (earphone/buds usage):
- Sustained talking pattern (>5 seconds) without phone in frame
- Head tilt bias analysis (common during calls)
- Lip movement frequency analysis

### Cognitive Load Estimation
Detects mental distraction (e.g., deep conversation) even when looking at road:
- **Reduced blink rate**: drops below 50% of baseline during cognitive tunneling
- **Fixated gaze**: low gaze position variance (staring without processing)
- **No scanning**: head movement range <3° (no mirror checks)
- **Monotone head pose**: near-zero pitch/yaw variance

### Computer Vision Models
- **MediaPipe FaceMesh**: 468+ facial landmarks with iris refinement at sub-10ms latency
- **TensorFlow.js COCO-SSD**: Real-time object detection for phone/distraction identification
- **Head Pose Estimation**: Pitch/Yaw/Roll computed from facial geometry (nose, eyes, chin, forehead landmarks)
- **Iris-Based Gaze Tracking**: Relative iris position within eye bounds for gaze direction

### Adaptive Calibration System
Personalizes detection thresholds per user by collecting 10s of baseline data:
- Computes user-specific EAR baseline and standard deviation
- Sets threshold at `baseline - 1.5 * stddev` (statistical personalization)
- Persists calibration with 24h expiry for session continuity

## Architecture

```
Frontend (React/TypeScript)          Backend (FastAPI/Python)
┌─────────────────────────┐         ┌──────────────────────────┐
│ WebcamFeed Component    │         │ REST API (Sessions/Events)│
│  ├─ useFaceMesh hook    │◄──WS──►│ WebSocket (Real-time)     │
│  ├─ useObjectDetect hook│         │ Analytics Engine          │
│  └─ Canvas Overlay      │         │ SQLite + SQLAlchemy       │
│                         │         │ Face Analyzer Service     │
│ ML Utils (client-side)  │         └──────────────────────────┘
│  ├─ headPoseEstimator   │
│  ├─ drowsinessModel     │
│  ├─ BlinkDetector       │
│  ├─ GazeStabilityTracker│
│  └─ AdaptiveCalibrator  │
└─────────────────────────┘
```

## Features
- **Real-Time Inference**: 30+ FPS face mesh + object detection running simultaneously
- **Composite Risk Score**: Weighted multi-signal fusion with confidence estimation
- **Talking vs Yawning**: Temporal frequency analysis to avoid false positives from speech
- **Hands-Free Call Detection**: Detects earphone/buds conversations without visible phone
- **Cognitive Load Monitoring**: Identifies mental distraction from reduced scanning/blinking
- **Head Pose Estimation**: 3D orientation (pitch/yaw/roll) for attention monitoring
- **Iris Gaze Tracking**: Directional gaze analysis from iris landmark positions
- **PERCLOS Algorithm**: Research-grade eye closure percentage metric
- **Blink Analytics**: Rate, duration, and microsleep detection
- **Adaptive Calibration**: User-specific baselines with statistical thresholding
- **Per-User MAR Baseline**: Learns individual mouth opening patterns for accurate yawn detection
- **Multi-Mode Visualization**: Mesh, contour, minimal, and off overlay modes
- **Real-Time Time Series**: Canvas-rendered live signal charts
- **Session Management**: Start/stop sessions with event logging to SQLite
- **Analytics Dashboard**: Historical trends, event distribution, severity analysis
- **CSV Export**: Download session data for offline analysis
- **Multi-Level Alerts**: 3-tier alert system with audio + TTS + vibration
- **WebSocket Streaming**: Bidirectional real-time communication with backend

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, Framer Motion, Recharts
- **Backend**: Python FastAPI, SQLite, SQLAlchemy, WebSocket
- **ML/CV**: MediaPipe FaceMesh, TensorFlow.js, COCO-SSD, Custom fusion model
- **Algorithms**: EAR, MAR, PERCLOS, Head Pose Estimation, Gaze Tracking, Adaptive Calibration

## Setup

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Docker
```bash
docker-compose up --build
```

## Project Structure
```
├── frontend/
│   └── src/
│       ├── components/       # WebcamFeed, DrowsinessGauge, HeadPoseVisualizer, RealTimeChart
│       ├── hooks/            # useFaceMesh, useObjectDetect, useAlertSound
│       ├── pages/            # Home, Monitor, Analytics, History
│       └── utils/            # headPoseEstimator, drowsinessModel, talkingDetector, cognitiveLoadDetector, calibration, EAR/MAR
├── backend/
│   ├── routers/              # sessions, events, websocket, analytics
│   ├── services/             # face_analyzer, alert_manager, session_logger
│   ├── database/             # SQLAlchemy models + DB setup
│   └── models/               # Pydantic schemas
└── docker-compose.yml
```

## Team & Contributions

| Contributor | Role | Key Deliverables |
|------------|------|-----------------|
| **[Mallika-coder](https://github.com/Mallika-coder)** | ML Pipeline & Architecture | Drowsiness fusion model, adaptive calibration, pipeline integration, project architecture |
| **[SimplyHarsh33](https://github.com/SimplyHarsh33)** | Frontend & UI/UX | React components, canvas visualizations, alert system, responsive layout, styling, home page |
| **[jivit-kumar](https://github.com/jivit-kumar)** | Computer Vision | Head pose estimation, gaze tracking, EAR/MAR algorithms, FaceMesh/COCO-SSD inference, WebcamFeed |
| **[Divyanshu64](https://github.com/Divyanshu64)** | Signal Processing & Analytics | Talking/yawn discriminator, cognitive load detection, hands-free call detection, analytics dashboard |
| **[hemant-pal164](https://github.com/hemant-pal164)** | Backend & Data | FastAPI REST/WebSocket APIs, database models, session management, analytics endpoints, history page |
