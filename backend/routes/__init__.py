from .user_routes import router as user_router
from .mentorship_routes import router as mentorship_router
from .ai_routes import router as ai_router
from .interview_routes import router as interview_router
from .chat_routes import router as chat_router
from .jobs_routes import router as jobs_router
from .posts_routes import router as posts_router

__all__ = [
    "user_router",
    "mentorship_router",
    "ai_router",
    "interview_router",
    "chat_router",
    "jobs_router",
    "posts_router",
]
