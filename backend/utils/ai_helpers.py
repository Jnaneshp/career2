import os
import json
import logging
from typing import List
import httpx

logger = logging.getLogger(__name__)

# --------------------------------------------------
# Configure Groq API
# --------------------------------------------------
GROQ_API_KEY = os.environ.get('GROQ_API_KEY', '')

if GROQ_API_KEY:
    masked_key = GROQ_API_KEY[:6] + "..." + GROQ_API_KEY[-4:]
    logger.info(f"✅ Groq API Key configured: {masked_key}")
else:
    logger.warning("⚠️ GROQ_API_KEY not set! Using fallback questions.")

# --------------------------------------------------
# Main function: Generate DSA questions using Groq API
# --------------------------------------------------
async def generate_company_questions(company: str, student_profile: dict) -> List[dict]:
    """Generate personalized DSA questions using Groq API"""
    
    solved_count = len(student_profile.get('solved_questions', []))
    weak_topics = student_profile.get('weak_topics', [])
    strong_topics = student_profile.get('strong_topics', [])
    
    skill_level = "Beginner" if solved_count < 10 else "Intermediate" if solved_count < 50 else "Advanced"
    
    prompt = f"""Generate 5 DIFFERENT coding interview questions for {company}.

Student: {skill_level} level, solved {solved_count} problems
Strong topics: {', '.join(strong_topics) if strong_topics else 'None'}
Weak topics: {', '.join(weak_topics) if weak_topics else 'All'}

Return ONLY valid JSON array (no markdown, no explanations) with 5 UNIQUE questions:
[
  {{
    "title": "Two Sum",
    "difficulty": "Easy",
    "category": "Array",
    "description": "Problem description",
    "input_format": "nums: List[int], target: int",
    "output_format": "List[int]",
    "examples": [{{"input": "[2,7,11,15], 9", "output": "[0,1]"}}],
    "constraints": ["2 <= nums.length <= 10^4"],
    "test_cases": [
      {{"input": "[2,7,11,15]\\n9", "expected_output": "[0,1]"}},
      {{"input": "[3,2,4]\\n6", "expected_output": "[1,2]"}}
    ],
    "frequency": "High",
    "hint": "Use hash map"
  }}
]

Generate 5 different questions with unique titles only.
"""

    if GROQ_API_KEY:
        try:
            logger.info(f"🤖 Asking Groq to generate questions for '{company}'...")
            logger.info(f"🧠 Student profile summary: {skill_level}, {solved_count} solved problems")

            async with httpx.AsyncClient(timeout=40.0) as client:
                response = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {GROQ_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "llama-3.3-70b-versatile",
                        "messages": [
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.9,
                        "max_tokens": 2000
                    }
                )

            logger.info(f"🌐 Groq API status: {response.status_code}")
            if response.status_code == 401:
                logger.error("❌ Groq authentication failed — invalid API key.")
                return get_fallback_questions()

            response.raise_for_status()
            data = response.json()

            # ✅ Corrected JSON parsing
            result_text = data["choices"][0]["message"]["content"].strip()
            logger.info(f"📝 Groq response preview: {result_text[:150]}...")

            # ✅ Remove markdown wrappers if Groq adds them
            if result_text.startswith("```"):
                lines = result_text.split("\n")
                result_text = "\n".join(lines[1:-1])
                if result_text.startswith("json"):
                    result_text = result_text[4:].strip()

            # ✅ Parse generated JSON safely
            try:
                questions = json.loads(result_text)
            except json.JSONDecodeError as e:
                logger.error(f"❌ JSON parsing failed: {e}")
                return get_fallback_questions()

            if not isinstance(questions, list):
                logger.error("❌ Groq output is not a valid JSON list.")
                return get_fallback_questions()

            logger.info(f"✅ Successfully generated {len(questions)} questions from Groq")

            # ✅ Ensure uniqueness of question titles
            titles = [q.get("title", "") for q in questions]
            if len(titles) != len(set(titles)):
                logger.warning("⚠️ Duplicate question titles detected — using fallback.")
                return get_fallback_questions()

            return questions[:5]

        except httpx.HTTPStatusError as e:
            logger.error(f"❌ Groq API HTTP error: {e.response.status_code}")
            return get_fallback_questions()
        except Exception as e:
            logger.error(f"❌ Unexpected Groq API error: {str(e)}")
            return get_fallback_questions()

    # --------------------------------------------------
    # Fallback when no API key
    # --------------------------------------------------
    logger.warning("⚠️ Using fallback questions (No API key or API failed)")
    return get_fallback_questions()

# --------------------------------------------------
# Fallback questions (default safe data)
# --------------------------------------------------
def get_fallback_questions():
    """Return 5 default fallback DSA questions"""
    return [
        {
            "title": "Two Sum",
            "difficulty": "Easy",
            "category": "Array",
            "description": "Given an array of integers nums and an integer target, return indices of the two numbers that add up to target.",
            "input_format": "nums: List[int], target: int",
            "output_format": "List[int]",
            "examples": [{"input": "[2,7,11,15], 9", "output": "[0,1]"}],
            "constraints": ["2 <= nums.length <= 10^4"],
            "test_cases": [
                {"input": "[2,7,11,15]\\n9", "expected_output": "[0,1]"},
                {"input": "[3,2,4]\\n6", "expected_output": "[1,2]"}
            ],
            "frequency": "High",
            "hint": "Use hash map"
        },
        {
            "title": "Valid Parentheses",
            "difficulty": "Easy",
            "category": "Stack",
            "description": "Check if the given string of brackets is valid.",
            "input_format": "s: str",
            "output_format": "bool",
            "examples": [{"input": "\"()\"", "output": "true"}],
            "constraints": ["1 <= s.length <= 10^4"],
            "test_cases": [
                {"input": "()[]{}\\n", "expected_output": "true"},
                {"input": "(]\\n", "expected_output": "false"}
            ],
            "frequency": "High",
            "hint": "Use a stack."
        },
        {
            "title": "Reverse Linked List",
            "difficulty": "Medium",
            "category": "Linked List",
            "description": "Reverse a singly linked list.",
            "input_format": "head: ListNode",
            "output_format": "ListNode",
            "examples": [{"input": "[1,2,3,4,5]", "output": "[5,4,3,2,1]"}],
            "constraints": ["0 <= length <= 5000"],
            "test_cases": [
                {"input": "1->2->3->4->5\\n", "expected_output": "5->4->3->2->1"}
            ],
            "frequency": "High",
            "hint": "Use three pointers."
        },
        {
            "title": "Merge Intervals",
            "difficulty": "Medium",
            "category": "Array",
            "description": "Merge all overlapping intervals in an array.",
            "input_format": "intervals: List[List[int]]",
            "output_format": "List[List[int]]",
            "examples": [{"input": "[[1,3],[2,6]]", "output": "[[1,6]]"}],
            "constraints": ["1 <= intervals.length <= 10^4"],
            "test_cases": [
                {"input": "[[1,3],[2,6],[8,10]]\\n", "expected_output": "[[1,6],[8,10]]"}
            ],
            "frequency": "Medium",
            "hint": "Sort by start time."
        },
        {
            "title": "LRU Cache",
            "difficulty": "Hard",
            "category": "Design",
            "description": "Design an LRU cache supporting get() and put() in O(1) time.",
            "input_format": "capacity: int",
            "output_format": "LRUCache",
            "examples": [{"input": "capacity=2", "output": "cache"}],
            "constraints": ["1 <= capacity <= 3000"],
            "test_cases": [
                {"input": "2\\nput 1 1\\nget 1\\n", "expected_output": "1"}
            ],
            "frequency": "High",
            "hint": "Use HashMap + Doubly Linked List."
        }
    ]
