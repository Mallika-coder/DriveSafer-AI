from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(prefix="/ws", tags=["websocket"])

@router.websocket("/stream")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            # Echo for now; server-side frame analysis logic can be added here
            await websocket.send_text(f"Message received")
    except WebSocketDisconnect:
        print("Client disconnected")
