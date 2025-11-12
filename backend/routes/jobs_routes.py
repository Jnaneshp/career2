# backend/routes/jobs_routes.py
from fastapi import APIRouter, Query
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/jobs", tags=["Jobs"])

JSEARCH_API_KEY = os.getenv("RAPIDAPI_KEY_JOBS") or os.getenv("RAPIDAPI_KEY")
JSEARCH_URL = "https://jsearch.p.rapidapi.com/search"


@router.get("/recommendations")
async def get_job_recommendations(
    skills: str = Query(..., description="Comma-separated skills"),
    location: str = Query("India", description="User's location")
):
    """
    Fetch job recommendations from JSearch API based on user's skills and location.
    """
    headers = {
        "x-rapidapi-key": JSEARCH_API_KEY,
        "x-rapidapi-host": "jsearch.p.rapidapi.com",
    }

    # Combine skills for a richer search query
    skill_query = skills.replace(",", " OR ")
    search_query = f"{skill_query} jobs in {location}"

    params = {"query": search_query, "num_pages": 1}

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(JSEARCH_URL, headers=headers, params=params)

        if response.status_code == 403:
            return {"jobs": [], "error": "Invalid or expired API key."}
        if response.status_code == 429:
            return {"jobs": [], "error": "Rate limit reached. Please try again later."}

        data = response.json()
        job_listings = []

        for job in data.get("data", []):
            # ✅ Filter only relevant jobs by matching keywords in title or description
            combined_text = (
                (job.get("job_title") or "").lower() +
                " " +
                (job.get("job_description") or "").lower()
            )
            if not any(skill.lower() in combined_text for skill in skills.split(",")):
                continue

            job_listings.append({
                "title": job.get("job_title"),
                "company": job.get("employer_name"),
                "location": job.get("job_city") or job.get("job_country"),
                "employment_type": job.get("job_employment_type"),
                "description": (job.get("job_description") or "")[:200],
                "apply_link": job.get("job_apply_link"),
                "posted_date": job.get("job_posted_at_datetime_utc"),
            })

        return {"jobs": job_listings[:10]}  # ✅ Return top 10 relevant jobs

    except Exception as e:
        print(f"⚠️ Job API error: {e}")
        return {"jobs": [], "error": "Server error fetching job listings."}
