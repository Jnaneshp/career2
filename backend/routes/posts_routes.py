# backend/routes/posts_routes.py
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


# ✅ Get feed
@router.get("/feed")
async def get_feed(limit: int = 20, skip: int = 0):
    cursor = db.posts.find().sort("created_at", -1).skip(skip).limit(limit)
    posts = await cursor.to_list(length=limit)

    def serialize(p):
        p["_id"] = str(p.get("_id"))
        if isinstance(p.get("created_at"), datetime):
            p["created_at"] = p["created_at"].isoformat()
        p["likes"] = p.get("likes") or []
        p["comments"] = p.get("comments") or []
        return p

    return {"posts": [serialize(p) for p in posts]}


# ✅ Get single post
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


# ✅ Like / Unlike
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
