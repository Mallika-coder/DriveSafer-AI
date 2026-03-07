# DriveSafe AI

A real-time driver monitoring system to detect drowsiness and phone distraction using a webcam feed.

## Features
- **Real-Time Face & Eye Detection**: MediaPipe FaceMesh
- **Eye Aspect Ratio (EAR)**: Drowsiness Detection
- **Mouth Aspect Ratio (MAR)**: Yawn Detection
- **Distraction Detection**: TensorFlow.js COCO-SSD for phone detection
- **Alert System**: Multi-level visual & audio alerts using Web Audio API
- **Analytics Dashboard**: Fast tracking metrics and session history via FastAPI + SQLite

## Tech Stack
- **Frontend**: React (Vite), TypeScript, TailwindCSS, Framer Motion
- **Backend**: Python FastAPI, SQLite, SQLAlchemy
- **ML Models**: MediaPipe FaceMesh, COCO-SSD (TensorFlow.js)

## Setup Instructions

### Backend Setup
1. `cd backend`
2. `python -m venv venv`
3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Linux/Mac: `source venv/bin/activate`
4. `pip install -r requirements.txt`
5. `uvicorn main:app --reload`

### Frontend Setup
1. `cd frontend`
2. `npm install`
3. `npm run dev`

### Docker
To run both services using Docker Compose:
```bash
docker-compose up --build
```
