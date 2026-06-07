from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class EventBase(BaseModel):
    event_type: str
    severity: int
    ear_value: Optional[float] = None

class EventCreate(EventBase):
    session_id: int

class EventResponse(EventBase):
    id: int
    session_id: int
    timestamp: datetime
    class Config:
        from_attributes = True

class SessionBase(BaseModel):
    pass

class SessionCreate(SessionBase):
    pass

class SessionResponse(SessionBase):
    id: int
    start_time: datetime
    end_time: Optional[datetime] = None
    duration: int
    total_distance: float
    events: List[EventResponse] = []
    class Config:
        from_attributes = True

class EndSessionRequest(BaseModel):
    total_distance: float = 0.0
