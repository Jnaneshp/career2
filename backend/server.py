# backend/server.py
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

# Now import routes and database (which depend on env vars)
from routes import user_router, mentorship_router, ai_router, interview_router
from config.database import client

# --------------------------------------------------
# Logging configuration
# --------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# --------------------------------------------------
# Create FastAPI app
# --------------------------------------------------
app = FastAPI(title="CareerConnect API", version="1.0.0")

# --------------------------------------------------
# CORS configuration
# --------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# --------------------------------------------------
# Root endpoint
# --------------------------------------------------
@app.get("/")
async def root():
    return {"message": "CareerConnect API", "version": "1.0.0"}

# --------------------------------------------------
# Register routers (prefix /api)
# --------------------------------------------------
app.include_router(user_router, prefix="/api")
app.include_router(mentorship_router, prefix="/api")
app.include_router(ai_router, prefix="/api")
app.include_router(interview_router, prefix="/api")

# --------------------------------------------------
# Graceful shutdown (close DB client)
# --------------------------------------------------
@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# --------------------------------------------------
# Run server (for local dev)
# --------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
