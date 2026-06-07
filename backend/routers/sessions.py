from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from database import models, db
from models import schemas

router = APIRouter(prefix="/api/sessions", tags=["sessions"])

@router.post("/start", response_model=schemas.SessionResponse)
def start_session(database: Session = Depends(db.get_db)):
    new_session = models.Session()
    database.add(new_session)
    database.commit()
    database.refresh(new_session)
    return new_session

@router.post("/{session_id}/end", response_model=schemas.SessionResponse)
def end_session(session_id: int, req: schemas.EndSessionRequest, database: Session = Depends(db.get_db)):
    session = database.query(models.Session).filter(models.Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.end_time = datetime.utcnow()
    session.duration = int((session.end_time - session.start_time).total_seconds())
    session.total_distance = req.total_distance
    database.commit()
    database.refresh(session)
    return session

@router.get("", response_model=List[schemas.SessionResponse])
def get_sessions(database: Session = Depends(db.get_db)):
    return database.query(models.Session).order_by(models.Session.start_time.desc()).all()

@router.get("/{session_id}", response_model=schemas.SessionResponse)
def get_session(session_id: int, database: Session = Depends(db.get_db)):
    session = database.query(models.Session).filter(models.Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@router.delete("/{session_id}")
def delete_session(session_id: int, database: Session = Depends(db.get_db)):
    session = database.query(models.Session).filter(models.Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    database.query(models.Event).filter(models.Event.session_id == session_id).delete()
    database.delete(session)
    database.commit()
    return {"message": "Session deleted"}
