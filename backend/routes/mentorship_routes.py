# backend/routes/mentorship_routes.py
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import datetime
from models import User, MentorshipRequest, MentorshipRequestCreate, MentorshipResponse
from config.database import db

router = APIRouter(prefix="/mentorship", tags=["mentorship"])

def calculate_compatibility(mentor: dict, mentee: dict) -> float:
    score = 0.0
    mentor_profile = mentor.get('mentor_profile', {})
    mentee_profile = mentee.get('mentee_profile', {})
    
    mentor_expertise = set(mentor_profile.get('expertise', []))
    skills_to_learn = set(mentee_profile.get('skills_to_learn', []))
    if mentor_expertise and skills_to_learn:
        overlap = len(mentor_expertise.intersection(skills_to_learn))
        score += (overlap / max(len(skills_to_learn), 1)) * 0.4
    
    mentor_skills = set(mentor.get('skills', []))
    mentee_skills = set(mentee.get('skills', []))
    if mentor_skills and mentee_skills:
        overlap = len(mentor_skills.intersection(mentee_skills))
        score += (overlap / max(len(mentee_skills), 1)) * 0.25
    
    years_exp = mentor_profile.get('years_experience', 0)
    if years_exp >= 5:
        score += 0.2
    elif years_exp >= 3:
        score += 0.1
    
    if mentor.get('location') and mentee.get('location'):
        if mentor['location'].lower() == mentee['location'].lower():
            score += 0.15
    
    return min(score * 100, 100)

@router.get("/mentors", response_model=List[User])
async def get_mentors(
    expertise: Optional[str] = Query(None),
    available: Optional[bool] = Query(None)
):
    filter_query = {"$or": [{"role": "mentor"}, {"role": "both"}]}
    
    if expertise:
        filter_query["mentor_profile.expertise"] = {"$in": expertise.split(",")}
    if available is not None:
        filter_query["mentor_profile.is_available"] = available
    
    mentors = await db.users.find(filter_query, {"_id": 0}).to_list(100)
    
    for mentor in mentors:
        if isinstance(mentor.get('created_at'), str):
            mentor['created_at'] = datetime.fromisoformat(mentor['created_at'])
        if isinstance(mentor.get('updated_at'), str):
            mentor['updated_at'] = datetime.fromisoformat(mentor['updated_at'])
    
    return mentors

@router.get("/matches/{user_id}")
async def get_mentor_matches(user_id: str):
    mentee = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not mentee:
        raise HTTPException(404, "User not found")
    
    mentors = await db.users.find({
        "$or": [{"role": "mentor"}, {"role": "both"}],
        "mentor_profile.is_available": True,
        "id": {"$ne": user_id}
    }, {"_id": 0}).to_list(100)
    
    matches = []
    for mentor in mentors:
        score = calculate_compatibility(mentor, mentee)
        if isinstance(mentor.get('created_at'), str):
            mentor['created_at'] = datetime.fromisoformat(mentor['created_at'])
        if isinstance(mentor.get('updated_at'), str):
            mentor['updated_at'] = datetime.fromisoformat(mentor['updated_at'])
        matches.append({"mentor": mentor, "compatibility_score": round(score, 2)})
    
    matches.sort(key=lambda x: x['compatibility_score'], reverse=True)
    return {"matches": matches[:5]}

@router.post("/request", response_model=MentorshipRequest)
async def create_mentorship_request(request_input: MentorshipRequestCreate):
    mentor = await db.users.find_one({"id": request_input.mentor_id})
    mentee = await db.users.find_one({"id": request_input.mentee_id})
    
    if not mentor or not mentee:
        raise HTTPException(404, "User not found")
    
    score = calculate_compatibility(mentor, mentee)
    request_dict = request_input.model_dump()
    request_obj = MentorshipRequest(**request_dict, compatibility_score=score)
    
    doc = request_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.mentorship_requests.insert_one(doc)
    return request_obj

@router.put("/{request_id}/respond")
async def respond_to_mentorship_request(request_id: str, response: MentorshipResponse):
    request_doc = await db.mentorship_requests.find_one({"id": request_id})
    if not request_doc:
        raise HTTPException(404, "Request not found")
    
    await db.mentorship_requests.update_one(
        {"id": request_id},
        {"$set": {"status": response.status}}
    )
    
    if response.status == "accepted":
        await db.users.update_one(
            {"id": request_doc['mentor_id']},
            {"$addToSet": {"connections": request_doc['mentee_id']}}
        )
        await db.users.update_one(
            {"id": request_doc['mentee_id']},
            {"$addToSet": {"connections": request_doc['mentor_id']}}
        )
    
    return {"message": "Request updated", "status": response.status}

@router.get("/my-requests/{user_id}")
async def get_user_mentorship_requests(user_id: str):
    requests = await db.mentorship_requests.find({
        "$or": [{"mentor_id": user_id}, {"mentee_id": user_id}]
    }, {"_id": 0}).to_list(100)
    
    for req in requests:
        if isinstance(req.get('created_at'), str):
            req['created_at'] = datetime.fromisoformat(req['created_at'])
    
    return {"requests": requests}
