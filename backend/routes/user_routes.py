# backend/routes/user_routes.py
from fastapi import APIRouter, HTTPException, Query, Depends, Header
from typing import List, Optional
from datetime import datetime, timezone
from models import User, UserCreate, UserUpdate, MentorProfile, MenteeProfile
from config.database import db
import logging

# Optional: Firebase Admin import for later verification
try:
    import firebase_admin
    from firebase_admin import credentials, auth as firebase_auth
except ImportError:
    firebase_admin = None

router = APIRouter(prefix="/users", tags=["users"])
logger = logging.getLogger(__name__)

# ✅ Initialize Firebase Admin if available
if firebase_admin and not firebase_admin._apps:
    try:
        cred = credentials.Certificate("serviceAccountKey.json")
        firebase_admin.initialize_app(cred)
        logger.info("✅ Firebase Admin initialized successfully")
    except Exception as e:
        logger.warning(f"⚠️ Firebase Admin initialization failed: {e}")


# ✅ Firebase Sync Endpoint
@router.post("/firebase-sync")
async def firebase_sync(user_data: dict):
    """
    Sync Firebase-authenticated user with MongoDB.
    If the Firebase UID exists, return the user.
    Otherwise, create a new user record automatically.
    """
    firebase_uid = user_data.get("firebase_uid")
    email = user_data.get("email")
    name = user_data.get("name", "New User")

    if not firebase_uid or not email:
        raise HTTPException(status_code=400, detail="Missing Firebase UID or email")

    existing_user = await db.users.find_one({"firebase_uid": firebase_uid}, {"_id": 0})
    if existing_user:
        return existing_user

    # If not found, create new user entry
    new_user = {
        "firebase_uid": firebase_uid,
        "email": email,
        "name": name,
        "role": "student",
        "college": "",
        "graduation_year": "",
        "skills": [],
        "mentor_profile": {},
        "mentee_profile": {},
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    # Default profile creation
    new_user["mentor_profile"] = MentorProfile().model_dump()
    new_user["mentee_profile"] = MenteeProfile().model_dump()

    await db.users.insert_one(new_user)
    logger.info(f"👤 New user created via Firebase: {email}")
    return new_user


# ✅ Optional: Verify Firebase Token Middleware
async def verify_firebase_token(authorization: Optional[str] = Header(None)):
    """
    Optional middleware to validate Firebase JWT for protected routes.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")

    token = authorization.split(" ")[1]
    try:
        decoded = firebase_auth.verify_id_token(token)
        return decoded
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid Firebase token: {e}")


# ✅ Create new user (manual signup for fallback)
@router.post("", response_model=User)
async def create_user(user_input: UserCreate):
    existing = await db.users.find_one({"email": user_input.email})
    if existing:
        raise HTTPException(400, "User already exists")

    user_dict = user_input.model_dump()
    user = User(**user_dict)

    # Add mentor/mentee profile
    if user.role in ["mentor", "both"]:
        user.mentor_profile = MentorProfile()
    if user.role in ["student", "both"]:
        user.mentee_profile = MenteeProfile()

    doc = user.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["updated_at"] = doc["updated_at"].isoformat()

    await db.users.insert_one(doc)
    return user


# ✅ Get user by ID
@router.get("/{user_id}", response_model=User)
async def get_user(user_id: str):
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(404, "User not found")

    # Convert timestamps back
    if isinstance(user.get("created_at"), str):
        user["created_at"] = datetime.fromisoformat(user["created_at"])
    if isinstance(user.get("updated_at"), str):
        user["updated_at"] = datetime.fromisoformat(user["updated_at"])

    return user


# ✅ Update user profile
@router.put("/{user_id}", response_model=User)
async def update_user(user_id: str, update_data: UserUpdate):
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(404, "User not found")

    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    if update_dict:
        update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.users.update_one({"id": user_id}, {"$set": update_dict})

    updated_user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if isinstance(updated_user.get("created_at"), str):
        updated_user["created_at"] = datetime.fromisoformat(updated_user["created_at"])
    if isinstance(updated_user.get("updated_at"), str):
        updated_user["updated_at"] = datetime.fromisoformat(updated_user["updated_at"])

    return updated_user


# ✅ Search users (with filters)
@router.get("", response_model=List[User])
async def search_users(
    query: Optional[str] = Query(None),
    skills: Optional[str] = Query(None),
    college: Optional[str] = Query(None),
):
    filter_query = {}
    if query:
        filter_query["$or"] = [
            {"name": {"$regex": query, "$options": "i"}},
            {"email": {"$regex": query, "$options": "i"}},
        ]
    if skills:
        skill_list = skills.split(",")
        filter_query["skills"] = {"$in": skill_list}
    if college:
        filter_query["college"] = {"$regex": college, "$options": "i"}

    users = await db.users.find(filter_query, {"_id": 0}).to_list(100)

    for user in users:
        if isinstance(user.get("created_at"), str):
            user["created_at"] = datetime.fromisoformat(user["created_at"])
        if isinstance(user.get("updated_at"), str):
            user["updated_at"] = datetime.fromisoformat(user["updated_at"])

    return users


# ✅ Optional: Get currently authenticated Firebase user (for debugging)
@router.get("/me")
async def get_current_user(decoded_token=Depends(verify_firebase_token)):
    """
    Example route to verify Firebase authentication.
    """
    uid = decoded_token.get("uid")
    user = await db.users.find_one({"firebase_uid": uid}, {"_id": 0})
    if not user:
        raise HTTPException(404, "User not found in database")
    return user
