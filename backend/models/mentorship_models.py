# backend/models/mentorship_models.py
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime, timezone
import uuid

class MentorshipRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    mentor_id: str
    mentee_id: str
    status: str = "pending"
    message: str = ""
    compatibility_score: float = 0.0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MentorshipRequestCreate(BaseModel):
    mentor_id: str
    mentee_id: str
    message: str

class MentorshipResponse(BaseModel):
    request_id: str
    status: str
