# backend/models/interview_models.py
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone
import uuid

class CodingQuestion(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    difficulty: str
    category: str
    description: str
    input_format: str
    output_format: str
    examples: List[dict]
    constraints: List[str]
    test_cases: List[dict]
    companies: List[str]
    frequency: str
    hint: Optional[str] = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CodeSubmission(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    question_id: str
    code: str
    language: str
    status: str
    execution_time: Optional[float] = None
    memory_used: Optional[float] = None
    test_results: List[dict] = []
    submitted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class InterviewPrepProfile(BaseModel):
    student_id: str
    target_companies: List[str] = []
    solved_questions: List[str] = []
    attempted_questions: List[str] = []
    failed_questions: List[str] = []
    readiness_score: float = 0.0
    strong_topics: List[str] = []
    weak_topics: List[str] = []
    last_practiced: Optional[datetime] = None
