# backend/models/user_models.py
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone
import uuid

class MentorProfile(BaseModel):
    is_available: bool = True
    expertise: List[str] = []
    years_experience: int = 0
    max_mentees: int = 5
    availability: str = ""

class MenteeProfile(BaseModel):
    seeking_mentor: bool = True
    career_goals: List[str] = []
    skills_to_learn: List[str] = []
    preferred_mentor_type: str = ""

class Experience(BaseModel):
    company: str
    role: str
    duration: str

class Education(BaseModel):
    institution: str
    degree: str
    year: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    role: str
    college: Optional[str] = ""
    graduation_year: Optional[str] = ""
    current_role: Optional[str] = ""
    bio: Optional[str] = ""
    skills: List[str] = []
    target_companies: List[str] = []
    experience: List[Experience] = []
    education: List[Education] = []
    location: Optional[str] = ""
    profile_pic: Optional[str] = ""
    mentor_profile: Optional[MentorProfile] = None
    mentee_profile: Optional[MenteeProfile] = None
    connections: List[str] = []
    connection_requests: List[dict] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: str
    name: str
    role: str
    college: Optional[str] = ""
    graduation_year: Optional[str] = ""

class UserUpdate(BaseModel):
    name: Optional[str] = None
    college: Optional[str] = None
    graduation_year: Optional[str] = None
    current_role: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[List[str]] = None
    target_companies: Optional[List[str]] = None
    experience: Optional[List[Experience]] = None
    education: Optional[List[Education]] = None
    location: Optional[str] = None
    profile_pic: Optional[str] = None
    mentor_profile: Optional[MentorProfile] = None
    mentee_profile: Optional[MenteeProfile] = None
