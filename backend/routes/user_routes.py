# backend/routes/user_routes.py
from fastapi import APIRouter, HTTPException, Query, Depends, Header
from typing import List, Optional
from datetime import datetime, timezone
from models.user_models import User, UserCreate, UserUpdate, MentorProfile, MenteeProfile
from config.database import db
from bson import ObjectId
import uuid
import logging

# Optional Firebase admin
try:
    import firebase_admin
    from firebase_admin import credentials, auth as firebase_auth
except ImportError:
    firebase_admin = None

router = APIRouter(prefix="/users", tags=["users"])
logger = logging.getLogger(__name__)


# ---------------------------------------------------------
# UTIL: SERIALIZE MONGODB USER
# ---------------------------------------------------------
def serialize_user(user: dict):
    if not user:
        return user

    # Convert ObjectId
    if "_id" in user:
        try:
            user["_id"] = str(user["_id"])
        except:
            pass

    # Ensure UUID 'id'
    if not user.get("id"):
        user["id"] = str(user.get("id") or user.get("_id") or uuid.uuid4())

    # Convert datetimes to ISO
    for key in ("created_at", "updated_at"):
        if user.get(key):
            try:
                if hasattr(user[key], "isoformat"):
                    user[key] = user[key].isoformat()
            except:
                user[key] = str(user[key])

    # Ensure missing lists are not None
    user["skills"] = user.get("skills") or []
    user["target_companies"] = user.get("target_companies") or []
    user["experience"] = user.get("experience") or []
    user["education"] = user.get("education") or []
    user["connections"] = user.get("connections") or []
    user["connection_requests"] = user.get("connection_requests") or []

    return user


# ---------------------------------------------------------
# Firebase Admin Init
# ---------------------------------------------------------
if firebase_admin and not firebase_admin._apps:
    try:
        cred = credentials.Certificate("serviceAccountKey.json")
        firebase_admin.initialize_app(cred)
        logger.info("🔥 Firebase Admin initialized")
    except Exception as e:
        logger.warning(f"⚠️ Firebase init failed: {e}")


# ---------------------------------------------------------
# ⭐ Firebase Sync — FIXED VERSION (role included)
# ---------------------------------------------------------
@router.post("/firebase-sync")
async def firebase_sync(user_data: dict):
    """
    Sync user after Firebase login.
    Creates a new user with the correct role sent from frontend.
    """

    firebase_uid = user_data.get("firebase_uid")
    email = user_data.get("email")
    name = user_data.get("name", "")
    role = user_data.get("role", "student")  # <-- FIXED

    if not firebase_uid or not email:
        raise HTTPException(status_code=400, detail="Missing Firebase UID or email")

    # Check by uid
    existing = await db.users.find_one({"firebase_uid": firebase_uid})
    if existing:
        return serialize_user(existing)

    # Check by email
    existing_email = await db.users.find_one({"email": email})
    if existing_email:
        await db.users.update_one(
            {"email": email},
            {"$set": {"firebase_uid": firebase_uid, "updated_at": datetime.now(timezone.utc)}},
        )
        updated = await db.users.find_one({"email": email})
        return serialize_user(updated)

    # Create new user
    new_user = {
        "id": str(uuid.uuid4()),
        "firebase_uid": firebase_uid,
        "email": email,
        "name": name or "New User",
        "role": role,  # <-- FIXED ROLE SAVING
        "college": user_data.get("college", ""),
        "graduation_year": user_data.get("graduation_year", ""),
        "skills": [],
        "target_companies": [],
        "experience": [],
        "education": [],
        "profile_pic": "",
        "mentor_profile": MentorProfile().model_dump(),
        "mentee_profile": MenteeProfile().model_dump(),
        "connections": [],
        "connection_requests": [],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }

    result = await db.users.insert_one(new_user)
    new_user["_id"] = str(result.inserted_id)

    logger.info(f"🎉 New user created: {email}")
    return serialize_user(new_user)


# ---------------------------------------------------------
# Firebase Token Verification (optional)
# ---------------------------------------------------------
async def verify_firebase_token(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token = authorization.split(" ")[1]
    try:
        decoded = firebase_auth.verify_id_token(token)
        return decoded
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")


# ---------------------------------------------------------
# Create User (Manual Signup)
# ---------------------------------------------------------
@router.post("", response_model=User)
async def create_user(user_input: UserCreate):
    existing = await db.users.find_one({"email": user_input.email})
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")

    user_obj = User(**user_input.model_dump())

    # Default mentor/mentee
    if user_obj.role in ["mentor", "both"]:
        user_obj.mentor_profile = MentorProfile()
    if user_obj.role in ["student", "both"]:
        user_obj.mentee_profile = MenteeProfile()

    doc = user_obj.model_dump()
    doc["created_at"] = datetime.now(timezone.utc)
    doc["updated_at"] = datetime.now(timezone.utc)

    await db.users.insert_one(doc)
    return serialize_user(doc)


# ---------------------------------------------------------
# Get User
# ---------------------------------------------------------
@router.get("/{user_id}")
async def get_user(user_id: str):
    query = {"id": user_id}

    if ObjectId.is_valid(user_id):
        query = {"_id": ObjectId(user_id)}

    user = await db.users.find_one(query)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return serialize_user(user)


# ---------------------------------------------------------
# Update User
# ---------------------------------------------------------
@router.put("/{user_id}")
async def update_user(user_id: str, update_data: UserUpdate):
    user = await db.users.find_one({"id": user_id})

    if not user and ObjectId.is_valid(user_id):
        user = await db.users.find_one({"_id": ObjectId(user_id)})

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc)

    # Update by id field
    if user.get("id"):
        await db.users.update_one({"id": user["id"]}, {"$set": update_dict})
        updated = await db.users.find_one({"id": user["id"]})
    else:
        await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": update_dict})
        updated = await db.users.find_one({"_id": ObjectId(user_id)})

    return serialize_user(updated)


# ---------------------------------------------------------
# Search Users
# ---------------------------------------------------------
@router.get("", response_model=List[User])
async def search_users(query: Optional[str] = Query(None), skills: Optional[str] = Query(None), college: Optional[str] = Query(None)):
    filter_query = {}

    if query:
        filter_query["$or"] = [
            {"name": {"$regex": query, "$options": "i"}},
            {"email": {"$regex": query, "$options": "i"}},
        ]

    if skills:
        skill_list = [s.strip() for s in skills.split(",") if s.strip()]
        filter_query["skills"] = {"$in": skill_list}

    if college:
        filter_query["college"] = {"$regex": college, "$options": "i"}

    users = await db.users.find(filter_query).to_list(200)
    return [serialize_user(u) for u in users]


# ---------------------------------------------------------
# Get Currently Logged in Firebase User
# ---------------------------------------------------------
@router.get("/me")
async def get_current_user(decoded=Depends(verify_firebase_token)):
    uid = decoded.get("uid")
    user = await db.users.find_one({"firebase_uid": uid})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return serialize_user(user)
