import os
import json
import requests
from typing import Dict, Any, List

# Load environment variables from the correct .env path
try:
    from dotenv import load_dotenv
    # Try backend-specific .env first, then project root .env
    backend_env = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
    root_env = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), ".env")
    if os.path.exists(backend_env):
        load_dotenv(backend_env)
    if os.path.exists(root_env):
        load_dotenv(root_env, override=False)
except ImportError:
    pass

# Read all config from environment only — no hardcoded fallbacks
NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY", "")
NVIDIA_MODEL = os.getenv("NVIDIA_MODEL", "")
NVIDIA_BASE_URL = os.getenv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Maximum retry attempts for LLM calls
MAX_RETRIES = 2


def call_llm(prompt: str, system_prompt: str = "You are an AI Scientific Research Assistant.") -> str:
    """Call LLM API using NVIDIA NIM, OpenAI, or Gemini, with retry logic and proper error propagation."""

    # Try NVIDIA NIM API
    if NVIDIA_API_KEY and NVIDIA_MODEL:
        for attempt in range(MAX_RETRIES):
            try:
                resp = requests.post(
                    f"{NVIDIA_BASE_URL}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {NVIDIA_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": NVIDIA_MODEL,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.6,
                        "top_p": 0.95,
                        "max_tokens": 4096,
                        "reasoning_budget": 16384
                    },
                    timeout=60
                )
                if resp.status_code == 200:
                    data = resp.json()
                    if "choices" in data and len(data["choices"]) > 0:
                        msg = data["choices"][0]["message"]
                        content = msg.get("content")
                        if content and content.strip():
                            return content
                        reasoning = msg.get("reasoning_content")
                        if reasoning and reasoning.strip():
                            return reasoning
                else:
                    print(f"NVIDIA API returned status {resp.status_code}: {resp.text[:200]}")
            except requests.exceptions.Timeout:
                print(f"NVIDIA API call timed out (attempt {attempt + 1}/{MAX_RETRIES})")
            except Exception as e:
                print(f"NVIDIA API call failed (attempt {attempt + 1}/{MAX_RETRIES}): {e}")

    # Try OpenAI API as fallback
    if OPENAI_API_KEY:
        for attempt in range(MAX_RETRIES):
            try:
                resp = requests.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"},
                    json={
                        "model": "gpt-4o-mini",
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.3
                    },
                    timeout=30
                )
                if resp.status_code == 200:
                    return resp.json()["choices"][0]["message"]["content"]
            except Exception as e:
                print(f"OpenAI API call failed (attempt {attempt + 1}/{MAX_RETRIES}): {e}")

    # Try Gemini API as fallback
    if GEMINI_API_KEY:
        for attempt in range(MAX_RETRIES):
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
                resp = requests.post(
                    url,
                    json={
                        "contents": [{"parts": [{"text": f"{system_prompt}\n\n{prompt}"}]}]
                    },
                    timeout=30
                )
                if resp.status_code == 200:
                    return resp.json()["candidates"][0]["content"]["parts"][0]["text"]
            except Exception as e:
                print(f"Gemini API call failed (attempt {attempt + 1}/{MAX_RETRIES}): {e}")

    # No LLM available — return empty string (caller handles gracefully)
    print("WARNING: All LLM providers failed or no API keys configured. Check your .env file.")
    return ""
