from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
import logging
import os
from dotenv import load_dotenv

# ✅ Load environment variables early (from .env)
load_dotenv()

# Optional: Log whether key is loaded (masked)
groq_key = os.environ.get("GROQ_API_KEY", "")
if groq_key:
    masked_key = groq_key[:6] + "..." + groq_key[-4:]
    print(f"✅ GROQ_API_KEY loaded successfully: {masked_key}")
else:
    print("⚠️ GROQ_API_KEY not found — AI features will use fallback.")

# --------------------------------------------------
# Import routes and database (after env vars loaded)
# --------------------------------------------------
from routes import (
    user_router,
    mentorship_router,
    ai_router,
    interview_router,
    chat_router,   # ✅ NEW: Chat routes for WebSocket
)
from config.database import client

# --------------------------------------------------
# Logging configuration
# --------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

# --------------------------------------------------
# Create FastAPI app
# --------------------------------------------------
app = FastAPI(title="CareerConnect API", version="1.1.0")

# --------------------------------------------------
# CORS configuration
# --------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",    # Frontend (React local dev)
        "http://127.0.0.1:3000",
        "https://careerconnect.vercel.app",  # Example deployed frontend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------
# Root endpoint
# --------------------------------------------------
@app.get("/")
async def root():
    return {"message": "CareerConnect API", "version": "1.1.0"}

# --------------------------------------------------
# Register routers (prefix /api)
# --------------------------------------------------
app.include_router(user_router, prefix="/api")
app.include_router(mentorship_router, prefix="/api")
app.include_router(ai_router, prefix="/api")
app.include_router(interview_router, prefix="/api")
app.include_router(chat_router, prefix="/api")  # ✅ NEW: WebSocket chat routes

# --------------------------------------------------
# Graceful shutdown (close DB client)
# --------------------------------------------------
@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
    logging.info("🧹 MongoDB client connection closed gracefully.")

# --------------------------------------------------
# Run server (for local dev)
# --------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    print("🚀 Starting CareerConnect backend with WebSocket support...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
