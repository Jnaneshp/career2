from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from typing import Optional
from datetime import datetime
from bson import ObjectId
import os
import uuid
import httpx
from config.database import db

router = APIRouter(prefix="/posts", tags=["Posts"])

# ✅ Cloudinary config
CLOUDINARY_UPLOAD_URL = os.getenv("CLOUDINARY_UPLOAD_URL")
CLOUDINARY_UPLOAD_PRESET = os.getenv("CLOUDINARY_UPLOAD_PRESET")


# ✅ Helper: Upload to Cloudinary
async def upload_to_cloudinary(file: UploadFile) -> Optional[str]:
    """
    Uploads file to Cloudinary (unsigned upload if preset is configured).
    Returns secure_url or None if failed.
    """
    if not CLOUDINARY_UPLOAD_URL:
        print("⚠️ Cloudinary URL not configured. Skipping upload.")
        return None

    try:
        file_content = await file.read()
        data = {"upload_preset": CLOUDINARY_UPLOAD_PRESET} if CLOUDINARY_UPLOAD_PRESET else {}
        files = {"file": (file.filename, file_content, file.content_type)}

        print(f"📤 Uploading '{file.filename}' to Cloudinary...")
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(CLOUDINARY_UPLOAD_URL, data=data, files=files)

        print("📦 Cloudinary response status:", resp.status_code)
        if resp.status_code != 200:
            print("❌ Cloudinary error response:", resp.text[:300])
            return None

        payload = resp.json()
        secure_url = payload.get("secure_url")
        if secure_url:
            print("✅ Cloudinary upload successful:", secure_url)
        else:
            print("⚠️ Cloudinary response missing secure_url:", payload)
        return secure_url

    except Exception as e:
        print("❌ Cloudinary upload exception:", e)
        return None


# ✅ Create Post
@router.post("/create")
async def create_post(
    author_id: str = Form(...),
    author_name: str = Form(...),
    content: str = Form(""),
    post_type: str = Form("text"),  # text | article | video
    media: Optional[UploadFile] = File(None),
):
    """
    Create a new post. Uploads media (if provided) to Cloudinary.
    """
    media_url = None
    if media:
        media_url = await upload_to_cloudinary(media)

    post_doc = {
        "author_id": author_id,
        "author_name": author_name,
        "content": content,
        "post_type": post_type,
        "media_url": media_url,
        "likes": [],
        "comments": [],
        "created_at": datetime.utcnow(),
    }

    result = await db.posts.insert_one(post_doc)
    post_doc["_id"] = str(result.inserted_id)
    post_doc["created_at"] = post_doc["created_at"].isoformat()

    return JSONResponse({"post": post_doc})


# ✅ Personalized Feed
@router.get("/feed")
async def get_feed(user_id: Optional[str] = None, limit: int = 20, skip: int = 0):
    """
    Personalized feed based on user's skills, target companies, and location.
    Falls back to recent posts if no similar users found.
    """
    try:
        # Case 1: No user_id provided → show general feed
        if not user_id:
            cursor = db.posts.find().sort("created_at", -1).skip(skip).limit(limit)
            posts = await cursor.to_list(length=limit)
            for p in posts:
                p["_id"] = str(p["_id"])
                if isinstance(p.get("created_at"), datetime):
                    p["created_at"] = p["created_at"].isoformat()
            return {"posts": posts}

        # ✅ Fetch the current user
        query = {"id": user_id} if not ObjectId.is_valid(user_id) else {"_id": ObjectId(user_id)}
        user = await db.users.find_one(query)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Normalize user features
        user_skills = {s.lower().strip() for s in user.get("skills", []) if isinstance(s, str)}
        user_companies = {c.lower().strip() for c in user.get("target_companies", []) if isinstance(c, str)}
        user_location = (user.get("location") or "").lower().strip()

        # ✅ Fetch recent posts (larger pool)
        posts = await db.posts.find().sort("created_at", -1).skip(skip).limit(limit * 4).to_list(length=limit * 4)
        author_ids = [p.get("author_id") for p in posts if p.get("author_id")]

        # ✅ Get author profiles for those posts
        authors = await db.users.find({"id": {"$in": author_ids}}).to_list(length=len(author_ids))
        author_map = {a["id"]: a for a in authors}

        personalized_posts = []

        for post in posts:
            author = author_map.get(post.get("author_id"))
            if not author:
                continue

            # Normalize author info
            author_skills = {s.lower().strip() for s in author.get("skills", []) if isinstance(s, str)}
            author_companies = {c.lower().strip() for c in author.get("target_companies", []) if isinstance(c, str)}
            author_location = (author.get("location") or "").lower().strip()

            # ✅ Similarity score calculation
            score = 0
            if user_skills & author_skills:
                score += 3
            if user_companies & author_companies:
                score += 2
            if user_location and author_location and user_location == author_location:
                score += 1

            if score > 0:
                post["_id"] = str(post["_id"])
                if isinstance(post.get("created_at"), datetime):
                    post["created_at"] = post["created_at"].isoformat()
                post["similarity_score"] = score
                personalized_posts.append(post)

        # ✅ Sort personalized posts by similarity score and recency
        personalized_posts.sort(key=lambda p: (-p.get("similarity_score", 0), p.get("created_at", "")))

        # ✅ Fallback if few matches
        if len(personalized_posts) < 5:
            extra = [p for p in posts if p not in personalized_posts][:5]
            for p in extra:
                p["_id"] = str(p["_id"])
                if isinstance(p.get("created_at"), datetime):
                    p["created_at"] = p["created_at"].isoformat()
            personalized_posts.extend(extra)

        return {"posts": personalized_posts[:limit]}

    except Exception as e:
        print("⚠️ Personalized feed error:", e)
        raise HTTPException(status_code=500, detail="Error generating personalized feed")


# ✅ Get Single Post
@router.get("/{post_id}")
async def get_post(post_id: str):
    try:
        query = {"_id": ObjectId(post_id)} if ObjectId.is_valid(post_id) else {"_id": post_id}
        post = await db.posts.find_one(query)
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")

        post["_id"] = str(post["_id"])
        if isinstance(post.get("created_at"), datetime):
            post["created_at"] = post["created_at"].isoformat()
        post["likes"] = post.get("likes") or []
        post["comments"] = post.get("comments") or []
        return {"post": post}
    except Exception as e:
        print("⚠️ get_post error:", e)
        raise HTTPException(status_code=500, detail="Error fetching post")


# ✅ Like / Unlike Post
@router.post("/like/{post_id}/{user_id}")
async def like_post(post_id: str, user_id: str):
    try:
        query = {"_id": ObjectId(post_id)} if ObjectId.is_valid(post_id) else {"_id": post_id}
        post = await db.posts.find_one(query)
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")

        likes = post.get("likes", [])
        if user_id in likes:
            await db.posts.update_one(query, {"$pull": {"likes": user_id}})
            liked = False
        else:
            await db.posts.update_one(query, {"$addToSet": {"likes": user_id}})
            liked = True

        updated = await db.posts.find_one(query)
        like_count = len(updated.get("likes", []))
        return {"liked": liked, "likes": like_count}
    except Exception as e:
        print("⚠️ like_post error:", e)
        raise HTTPException(status_code=500, detail="Error toggling like")


# ✅ Add Comment
@router.post("/comment/{post_id}")
async def add_comment(
    post_id: str,
    user_id: str = Form(...),
    user_name: str = Form(...),
    text: str = Form(...),
):
    try:
        query = {"_id": ObjectId(post_id)} if ObjectId.is_valid(post_id) else {"_id": post_id}
        post = await db.posts.find_one(query)
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")

        comment = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "user_name": user_name,
            "text": text,
            "timestamp": datetime.utcnow().isoformat(),
        }

        await db.posts.update_one(query, {"$push": {"comments": comment}})
        return {"comment": comment}
    except Exception as e:
        print("⚠️ add_comment error:", e)
        raise HTTPException(status_code=500, detail="Error adding comment")
