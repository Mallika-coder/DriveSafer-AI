import json
import time
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from services.face_analyzer import eye_aspect_ratio, mouth_aspect_ratio, calculate_drowsiness_score
from services.alert_manager import AlertManager

router = APIRouter(prefix="/ws", tags=["websocket"])

alert_manager = AlertManager()

@router.websocket("/stream")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    ear_history = []
    yawn_count = 0
    alert_count = 0

    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)

            if payload.get("type") == "frame_metrics":
                ear = payload.get("ear", 0)
                mar = payload.get("mar", 0)
                head_pose = payload.get("headPose", {})
                perclos = payload.get("perclos", 0)

                ear_history.append(ear)
                if len(ear_history) > 100:
                    ear_history.pop(0)

                if mar > 0.6:
                    yawn_count += 1

                drowsiness_score = calculate_drowsiness_score(ear_history, yawn_count, alert_count)

                alert_type = None
                if drowsiness_score > 70:
                    alert_type = "critical"
                elif drowsiness_score > 45:
                    alert_type = "warning"

                response = {
                    "type": "analysis_result",
                    "drowsinessScore": drowsiness_score,
                    "earAvg": sum(ear_history[-30:]) / max(1, len(ear_history[-30:])),
                    "yawnCount": yawn_count,
                    "alertTriggered": False,
                }

                if alert_type and alert_manager.should_trigger_alert(alert_type, time.time()):
                    alert_count += 1
                    response["alertTriggered"] = True
                    response["alertType"] = alert_type

                await websocket.send_text(json.dumps(response))

            elif payload.get("type") == "ping":
                await websocket.send_text(json.dumps({"type": "pong", "timestamp": time.time()}))

    except WebSocketDisconnect:
        pass
