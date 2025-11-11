from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
from models.interview_models import CodingQuestion, CodeSubmission
from config.database import db
from utils.ai_helpers import generate_company_questions
from utils.code_executor import execute_code
import logging
import math

router = APIRouter(prefix="/interview-prep", tags=["interview-prep"])
logger = logging.getLogger(__name__)

# ✅ Request model for code submission
class CodeSubmissionRequest(BaseModel):
    student_id: str
    question_id: str
    code: str
    language: str


# ✅ Set Target Companies
@router.post("/set-companies")
async def set_target_companies(student_id: str, companies: List[str]):
    await db.users.update_one(
        {"id": student_id},
        {"$set": {"target_companies": companies}}
    )

    await db.interview_prep_profiles.update_one(
        {"student_id": student_id},
        {"$set": {"target_companies": companies}},
        upsert=True
    )

    return {"message": "Target companies updated", "companies": companies}


# ✅ Fetch Company Questions (with force_refresh support)
@router.get("/questions")
async def get_company_questions(
    company: str = Query(...),
    student_id: str = Query(...),
    force_refresh: Optional[bool] = Query(False)
):
    """
    Fetch coding questions for a company.
    If force_refresh=True, skip cached results and regenerate new ones using Groq API.
    """

    logger.info(f"🧠 Fetching questions for {company} (force_refresh={force_refresh})...")

    # Fetch student prep profile
    prep_profile = await db.interview_prep_profiles.find_one(
        {"student_id": student_id}, {"_id": 0}
    ) or {"solved_questions": [], "weak_topics": [], "strong_topics": []}

    # Cache lookup (skip if force_refresh=True)
    if not force_refresh:
        cached_questions = await db.coding_questions.find({
            "companies": company,
            "created_at": {"$gte": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()}
        }, {"_id": 0}).to_list(100)

        if cached_questions and len(cached_questions) >= 5:
            logger.info(f"✅ Using cached questions for {company} ({len(cached_questions)} found).")
            return {"questions": cached_questions[:5], "cached": True}

    # No cache or force refresh → regenerate
    logger.info(f"🚀 Generating new questions for {company} via Groq API...")
    questions_data = await generate_company_questions(company, prep_profile)

    if not questions_data:
        raise HTTPException(500, "Failed to generate new questions from AI")

    # Remove old cached questions for that company (optional cleanup)
    await db.coding_questions.delete_many({"companies": company})

    saved_questions = []
    for q_data in questions_data:
        question = CodingQuestion(**q_data, companies=[company])
        doc = question.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.coding_questions.insert_one(doc)
        saved_questions.append(question.model_dump())

    logger.info(f"💾 Saved {len(saved_questions)} new questions for {company}")
    return {"questions": saved_questions, "cached": False}


# ✅ Get Question by ID
@router.get("/question/{question_id}")
async def get_question_details(question_id: str):
    question = await db.coding_questions.find_one({"id": question_id}, {"_id": 0})
    if not question:
        raise HTTPException(404, "Question not found")

    if isinstance(question.get('created_at'), str):
        question['created_at'] = datetime.fromisoformat(question['created_at'])

    return {"question": question}


# ✅ Submit Code for Evaluation
@router.post("/submit")
async def submit_code_solution(submission: CodeSubmissionRequest):
    """Submit code for evaluation"""

    question = await db.coding_questions.find_one({"id": submission.question_id}, {"_id": 0})
    if not question:
        raise HTTPException(404, "Question not found")

    logger.info(f"🚀 Executing {submission.language} code for student {submission.student_id}...")

    execution_result = await execute_code(
        submission.code, submission.language, question['test_cases']
    )

    # ✅ Normalize and mark test case results
    for test in execution_result['test_results']:
        expected = (test['test_case'].get('expected_output', '') or '').strip()
        output = (test.get('output', '') or '').strip()

        if output.startswith('[') and expected.startswith('['):
            output = output.replace(' ', '')
            expected = expected.replace(' ', '')

        test['passed'] = (output == expected) and not test.get('error')

    passed = sum(1 for t in execution_result['test_results'] if t['passed'])
    total = len(execution_result['test_results'])

    # ✅ Save submission
    submission_doc = CodeSubmission(
        student_id=submission.student_id,
        question_id=submission.question_id,
        code=submission.code,
        language=submission.language,
        status="accepted" if passed == total else "wrong_answer",
        test_results=execution_result['test_results']
    )

    doc = submission_doc.model_dump()
    doc['submitted_at'] = doc['submitted_at'].isoformat()
    await db.code_submissions.insert_one(doc)

    # ✅ Update progress
    update_data = {
        "$addToSet": {"attempted_questions": submission.question_id},
        "$set": {"last_practiced": datetime.now(timezone.utc).isoformat()}
    }

    if passed == total:
        update_data["$addToSet"]["solved_questions"] = submission.question_id
        update_data["$addToSet"]["strong_topics"] = question['category']
        update_data["$pull"] = {"weak_topics": question['category']}
    else:
        update_data["$addToSet"]["failed_questions"] = submission.question_id
        update_data["$addToSet"]["weak_topics"] = question['category']

    await db.interview_prep_profiles.update_one(
        {"student_id": submission.student_id},
        update_data,
        upsert=True
    )

    prep_profile = await db.interview_prep_profiles.find_one(
        {"student_id": submission.student_id}, {"_id": 0}
    ) or {}

    solved_count = len(prep_profile.get('solved_questions', []))
    readiness = min((solved_count / 50) * 100, 100)

    await db.interview_prep_profiles.update_one(
        {"student_id": submission.student_id},
        {"$set": {"readiness_score": readiness}}
    )

    # ✅ Response
    return {
        "submission_id": submission_doc.id,
        "status": "accepted" if passed == total else "wrong_answer",
        "test_results": execution_result['test_results'],
        "passed": passed,
        "total": total,
        "readiness_score": round(readiness, 1)
    }


# ✅ Get Student Progress
@router.get("/progress/{student_id}")
async def get_student_progress(student_id: str):
    prep_profile = await db.interview_prep_profiles.find_one(
        {"student_id": student_id}, {"_id": 0}
    )

    if not prep_profile:
        return {
            "profile": {
                "student_id": student_id,
                "target_companies": [],
                "solved_questions": [],
                "readiness_score": 0,
                "strong_topics": [],
                "weak_topics": []
            },
            "recent_submissions": []
        }

    submissions = await db.code_submissions.find(
        {"student_id": student_id}, {"_id": 0}
    ).sort("submitted_at", -1).limit(10).to_list(10)

    for sub in submissions:
        if isinstance(sub.get('submitted_at'), str):
            sub['submitted_at'] = datetime.fromisoformat(sub['submitted_at'])

    return {"profile": prep_profile, "recent_submissions": submissions}


# ✅ Readiness per Company
@router.get("/readiness/{student_id}")
async def get_company_readiness(student_id: str):
    user = await db.users.find_one({"id": student_id}, {"_id": 0})
    if not user:
        raise HTTPException(404, "User not found")

    target_companies = user.get('target_companies', [])
    if not target_companies:
        return {"readiness": [], "message": "No target companies set"}

    prep_profile = await db.interview_prep_profiles.find_one(
        {"student_id": student_id}, {"_id": 0}
    ) or {}

    solved = set(prep_profile.get('solved_questions', []))
    readiness_data = []

    for company in target_companies:
        company_questions = await db.coding_questions.find(
            {"companies": company}, {"_id": 0, "id": 1}
        ).to_list(100)

        company_q_ids = {q['id'] for q in company_questions}
        solved_for_company = len(solved.intersection(company_q_ids))
        total_needed = 50

        readiness_data.append({
            "company": company,
            "readiness_percentage": round((solved_for_company / total_needed) * 100, 1),
            "questions_solved": solved_for_company,
            "questions_needed": total_needed,
            "weak_areas": prep_profile.get('weak_topics', [])
        })

    return {"readiness": readiness_data}
