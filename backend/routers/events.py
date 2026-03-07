from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import models, db
from ..models import schemas

router = APIRouter(prefix="/api", tags=["events"])

@router.post("/events", response_model=schemas.EventResponse)
def log_event(event: schemas.EventCreate, database: Session = Depends(db.get_db)):
    session = database.query(models.Session).filter(models.Session.id == event.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    new_event = models.Event(**event.dict())
    database.add(new_event)
    database.commit()
    database.refresh(new_event)
    return new_event

@router.get("/sessions/{session_id}/events", response_model=List[schemas.EventResponse])
def get_session_events(session_id: int, database: Session = Depends(db.get_db)):
    events = database.query(models.Event).filter(models.Event.session_id == session_id).order_by(models.Event.timestamp.desc()).all()
    return events
