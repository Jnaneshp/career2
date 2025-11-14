from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from datetime import datetime
from bson import ObjectId
from config.database import db
import traceback

router = APIRouter(prefix="/chat", tags=["Chat"])

connected_clients = {}

def safe_serialize(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    elif isinstance(obj, ObjectId):
        return str(obj)
    elif isinstance(obj, dict):
        return {k: safe_serialize(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [safe_serialize(v) for v in obj]
    return obj


@router.websocket("/ws/{room_id}/{user_id}")
async def websocket_chat(websocket: WebSocket, room_id: str, user_id: str):
    """Real-time chat WebSocket handler"""
    origin = websocket.headers.get("origin")
    allowed_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://careerconnect.vercel.app",
        "https://carrerconnect-atj8.onrender.com",
      "https://career2-7zue.vercel.app",   # ADD THIS
    "https://*.vercel.app" ,
    "https://career2-7zue-eaxg6t8ir-jnaneshps-projects.vercel.app", 
    
    ]

    if origin not in allowed_origins:
        print(f"❌ Rejected WebSocket from origin: {origin}")
        await websocket.close(code=403)
        return

    await websocket.accept()
    print(f"✅ WebSocket connected: {user_id} joined {room_id}")

    connected_clients.setdefault(room_id, []).append(websocket)

    try:
        while True:
            try:
                # Wait for message
                data = await websocket.receive_json()

            except WebSocketDisconnect:
                print(f"🔌 {user_id} disconnected from {room_id}")
                break

            except RuntimeError as e:
                # Connection forcibly closed
                print(f"⚠️ Connection closed unexpectedly: {e}")
                break

            except Exception as e:
                # Non-disconnect error (e.g., bad JSON)
                print(f"⚠️ Error reading message: {e}")
                traceback.print_exc()
                continue

            # Handle valid message
            message_text = data.get("message", "").strip()
            if not message_text:
                continue

            message_doc = {
                "room_id": room_id,
                "sender_id": user_id,
                "message": message_text,
                "timestamp": datetime.utcnow(),
            }

            try:
                await db.chat_messages.insert_one(message_doc)
            except Exception as db_err:
                print(f"⚠️ Database insert failed: {db_err}")

            serialized_msg = safe_serialize(message_doc)
            living_clients = []

            for conn in connected_clients.get(room_id, []):
                try:
                    await conn.send_json(serialized_msg)
                    living_clients.append(conn)
                except Exception as send_err:
                    print(f"⚠️ Failed to send message: {send_err}")

            connected_clients[room_id] = living_clients

    finally:
        # Always cleanup even if exception happens
        if room_id in connected_clients and websocket in connected_clients[room_id]:
            connected_clients[room_id].remove(websocket)
        if room_id in connected_clients and not connected_clients[room_id]:
            del connected_clients[room_id]
        print(f"🧹 Cleaned up connection for {user_id} in room {room_id}")


@router.get("/history/{room_id}")
async def get_chat_history(room_id: str):
    """Fetch complete chat history from MongoDB for a given room"""
    try:
        messages = (
            await db.chat_messages.find({"room_id": room_id})
            .sort("timestamp", 1)
            .to_list(None)
        )
        return {"messages": safe_serialize(messages)}

    except Exception as e:
        print(f"❌ Failed to fetch chat history: {e}")
        traceback.print_exc()
        return {"messages": [], "error": "Could not retrieve chat history"}
