from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, models
from routers import sessions, events, websocket, analytics

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="DriveSafe AI Backend",
    version="2.0.0",
    description="Real-time driver fatigue detection API with multi-signal ML fusion",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sessions.router)
app.include_router(events.router)
app.include_router(websocket.router)
app.include_router(analytics.router)


@app.get("/")
def read_root():
    return {
        "message": "DriveSafe AI API is running",
        "version": "2.0.0",
        "features": [
            "Real-time drowsiness detection",
            "Multi-signal fusion (EAR, MAR, PERCLOS, head pose, gaze)",
            "Adaptive calibration",
            "WebSocket streaming",
            "Session analytics",
        ],
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}
