# backend/routes/ai_routes.py
from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
from models import AIChatRequest, AIChatResponse
from config.database import db
import uuid
import logging
import os
from groq import Groq

router = APIRouter(prefix="/ai", tags=["ai"])
logger = logging.getLogger(__name__)

# Configure Groq AI
GROQ_API_KEY = os.environ.get('GROQ_API_KEY', '')

if GROQ_API_KEY:
    client = Groq(api_key=GROQ_API_KEY)
    logger.info("✅ Groq AI configured")
else:
    logger.warning("⚠️ GROQ_API_KEY not set! AI chat will use fallback responses.")
    client = None

@router.post("/chat", response_model=AIChatResponse)
async def ai_chat(chat_request: AIChatRequest):
    try:
        user = await db.users.find_one({"id": chat_request.user_id}, {"_id": 0})
        if not user:
            raise HTTPException(404, "User not found")
        
        # Get chat history
        chat_history_doc = await db.chat_history.find_one({"user_id": chat_request.user_id}, {"_id": 0})
        
        # Build context
        system_prompt = f"""You are an expert career counselor and coding interview mentor.

User Profile:
- Name: {user.get('name', 'Student')}
- College: {user.get('college', 'Not specified')}
- Role: {user.get('current_role', 'Student')}
- Skills: {', '.join(user.get('skills', [])) if user.get('skills') else 'Not specified'}
- Target Companies: {', '.join(user.get('target_companies', [])) if user.get('target_companies') else 'Not specified'}

Provide personalized, actionable career advice. Be concise, encouraging, and practical."""

        # Try Groq API if available
        if client:
            try:
                # Prepare conversation history
                messages = [{"role": "system", "content": system_prompt}]
                
                if chat_history_doc and chat_history_doc.get('messages'):
                    for msg in chat_history_doc['messages'][-5:]:  # Last 5 messages
                        role = "user" if msg['role'] == 'user' else "assistant"
                        messages.append({"role": role, "content": msg['content']})
                
                messages.append({"role": "user", "content": chat_request.message})
                
                # Call Groq
                logger.info(f"🤖 Sending to Groq: {chat_request.message[:50]}...")
                completion = client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=messages,
                    temperature=0.7,
                )
                
                ai_response = completion.choices[0].message.content
                logger.info(f"✅ Groq response received ({len(ai_response)} chars)")
                
            except Exception as e:
                logger.error(f"❌ Groq API error: {str(e)}")
                ai_response = get_fallback_response()
        else:
            ai_response = get_fallback_response()
        
        # Store in database
        if not chat_history_doc:
            chat_history_doc = {
                "id": str(uuid.uuid4()),
                "user_id": chat_request.user_id,
                "messages": [],
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        
        chat_history_doc.setdefault('messages', []).extend([
            {"role": "user", "content": chat_request.message, "timestamp": datetime.now(timezone.utc).isoformat()},
            {"role": "assistant", "content": ai_response, "timestamp": datetime.now(timezone.utc).isoformat()}
        ])
        
        await db.chat_history.update_one(
            {"user_id": chat_request.user_id},
            {"$set": chat_history_doc},
            upsert=True
        )
        
        return AIChatResponse(response=ai_response)
    
    except Exception as e:
        logger.error(f"AI chat error: {str(e)}")
        return AIChatResponse(response=get_fallback_response())

def get_fallback_response():
    """Return a helpful fallback response when AI is unavailable"""
    return """I'm here to help with your career! I can assist with:

• Resume and profile optimization
• Interview preparation strategies  
• Career path guidance
• Skill development recommendations
• Company-specific advice

Please try asking your question again, or rephrase it for better results."""

@router.get("/history/{user_id}")
async def get_chat_history(user_id: str):
    """Get chat history for a user"""
    chat_history = await db.chat_history.find_one({"user_id": user_id}, {"_id": 0})
    if not chat_history:
        return {"messages": []}
    
    for msg in chat_history.get('messages', []):
        if isinstance(msg.get('timestamp'), str):
            msg['timestamp'] = datetime.fromisoformat(msg['timestamp'])
    
    return chat_history

@router.delete("/history/{user_id}")
async def clear_chat_history(user_id: str):
    """Clear chat history for a user"""
    result = await db.chat_history.delete_one({"user_id": user_id})
    
    if result.deleted_count == 0:
        return {"message": "No chat history found"}
    
    return {"message": "Chat history cleared successfully"}
