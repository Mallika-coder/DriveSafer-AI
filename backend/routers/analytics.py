from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from database import models, db

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/summary")
def get_analytics_summary(database: Session = Depends(db.get_db)):
    total_sessions = database.query(func.count(models.Session.id)).scalar()
    total_events = database.query(func.count(models.Event.id)).scalar()
    total_drive_time = database.query(func.sum(models.Session.duration)).scalar() or 0

    events_by_type = (
        database.query(models.Event.event_type, func.count(models.Event.id))
        .group_by(models.Event.event_type)
        .all()
    )

    severity_distribution = (
        database.query(models.Event.severity, func.count(models.Event.id))
        .group_by(models.Event.severity)
        .all()
    )

    avg_ear = database.query(func.avg(models.Event.ear_value)).filter(
        models.Event.ear_value.isnot(None)
    ).scalar()

    return {
        "total_sessions": total_sessions,
        "total_events": total_events,
        "total_drive_time_seconds": total_drive_time,
        "events_by_type": {t: c for t, c in events_by_type},
        "severity_distribution": {str(s): c for s, c in severity_distribution},
        "average_ear": round(avg_ear, 4) if avg_ear else None,
    }


@router.get("/trends")
def get_trends(days: int = 7, database: Session = Depends(db.get_db)):
    cutoff = datetime.utcnow() - timedelta(days=days)

    daily_events = (
        database.query(
            func.date(models.Event.timestamp),
            func.count(models.Event.id),
            func.avg(models.Event.severity),
        )
        .filter(models.Event.timestamp >= cutoff)
        .group_by(func.date(models.Event.timestamp))
        .order_by(func.date(models.Event.timestamp))
        .all()
    )

    return [
        {"date": str(date), "event_count": count, "avg_severity": round(avg_sev, 2) if avg_sev else 0}
        for date, count, avg_sev in daily_events
    ]
