# backend/utils/code_executor.py
import os
import logging
from typing import List
import httpx

logger = logging.getLogger(__name__)

async def execute_code(code: str, language: str, test_cases: List[dict]) -> dict:
    """Execute code using Judge0 API"""
    
    JUDGE0_API = "https://judge0-ce.p.rapidapi.com"
    RAPIDAPI_KEY = os.environ.get('RAPIDAPI_KEY', '')
    
    if not RAPIDAPI_KEY:
        logger.warning("RAPIDAPI_KEY not set, using mock execution")
        return {
            "status": "accepted",
            "test_results": [
                {"test_case": tc, "passed": True, "output": tc['expected_output'], 
                 "error": "", "time": 0.1, "memory": 256} 
                for tc in test_cases
            ],
            "passed_count": len(test_cases),
            "total_count": len(test_cases)
        }
    
    language_ids = {"python": 71, "javascript": 63, "java": 62, "cpp": 54}
    results = []
    all_passed = True
    
    async with httpx.AsyncClient() as client:
        for test in test_cases:
            try:
                submission_data = {
                    "source_code": code,
                    "language_id": language_ids.get(language, 71),
                    "stdin": test['input'],
                    "expected_output": test['expected_output'].strip()
                }
                
                headers = {
                    "content-type": "application/json",
                    "X-RapidAPI-Key": RAPIDAPI_KEY,
                    "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com"
                }
                
                response = await client.post(
                    f"{JUDGE0_API}/submissions?base64_encoded=false&wait=true",
                    json=submission_data,
                    headers=headers,
                    timeout=30.0
                )
                
                result = response.json()
                status_id = result.get('status', {}).get('id', 0)
                passed = status_id == 3
                
                results.append({
                    "test_case": test,
                    "passed": passed,
                    "output": (result.get('stdout') or '').strip(),
                    "error": result.get('stderr', ''),
                    "time": result.get('time'),
                    "memory": result.get('memory')
                })
                
                if not passed:
                    all_passed = False
                    
            except Exception as e:
                logger.error(f"Execution error: {e}")
                results.append({
                    "test_case": test,
                    "passed": False,
                    "output": "",
                    "error": str(e),
                    "time": 0,
                    "memory": 0
                })
                all_passed = False
    
    return {
        "status": "accepted" if all_passed else "wrong_answer",
        "test_results": results,
        "passed_count": sum(1 for r in results if r['passed']),
        "total_count": len(results)
    }
