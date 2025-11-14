from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
import logging
import os
from dotenv import load_dotenv

# --------------------------------------------------
# ✅ Load environment variables early (from .env)
# --------------------------------------------------
load_dotenv()

# Masked key logging
groq_key = os.environ.get("GROQ_API_KEY", "")
if groq_key:
    masked_key = groq_key[:6] + "..." + groq_key[-4:]
    print(f"✅ GROQ_API_KEY loaded successfully: {masked_key}")
else:
    print("⚠️ GROQ_API_KEY not found — AI features will use fallback.")

# --------------------------------------------------
# Import routes & database (after env loaded)
# --------------------------------------------------
from routes import (
    user_router,
    mentorship_router,
    ai_router,
    interview_router,
    chat_router,     # 💬 WebSocket Chat routes
    jobs_router,     # 💼 Job Recommendation routes
    posts_router,    # 📰 New: Posts / Feed routes
)
from config.database import client

# --------------------------------------------------
# Logging configuration
# --------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

# --------------------------------------------------
# Create FastAPI app
# --------------------------------------------------
app = FastAPI(
    title="CareerConnect API",
    version="1.3.0",
    description="Backend for CareerConnect — Professional networking, mentorship, job recommendations, and content sharing platform."
)

# --------------------------------------------------
# CORS configuration
# --------------------------------------------------
allowed_origins = [
    "http://localhost:3000",            # Local React dev
    "http://127.0.0.1:3000",
    "https://careerconnect.vercel.app",
    "https://career2-7zue.vercel.app",# Deployed frontend
    "https://career2-7zue-eaxg6t8ir-jnaneshps-projects.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------
# Root endpoint
# --------------------------------------------------
@app.get("/")
async def root():
    return {
        "message": "🚀 CareerConnect API running successfully!",
        "version": "1.3.0",
        "features": [
            "User Management",
            "Mentorship Matching",
            "AI Assistant",
            "Interview Prep",
            "Real-time Chat (WebSocket)",
            "Job Recommendations",
            "Posts / Feed System",
        ],
    }

# --------------------------------------------------
# Register routers (with prefix /api)
# --------------------------------------------------
app.include_router(user_router, prefix="/api")
app.include_router(mentorship_router, prefix="/api")
app.include_router(ai_router, prefix="/api")
app.include_router(interview_router, prefix="/api")
app.include_router(chat_router, prefix="/api")   # 💬 WebSocket Chat
app.include_router(jobs_router, prefix="/api")   # 💼 Job Recommendations
app.include_router(posts_router, prefix="/api")  # 📰 Feed / Articles / Reels

# --------------------------------------------------
# Graceful shutdown
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
    print("🚀 Starting CareerConnect backend with Chat + Job + Feed modules...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
