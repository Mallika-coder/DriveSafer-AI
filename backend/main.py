from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, models
from .routers import sessions, events, websocket

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="DriveSafe AI Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sessions.router)
app.include_router(events.router)
app.include_router(websocket.router)

@app.get("/")
def read_root():
    return {"message": "DriveSafe AI API is running"}
