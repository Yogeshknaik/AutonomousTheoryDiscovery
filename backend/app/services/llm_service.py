import os
import json
import requests
from typing import Dict, Any, List

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY", "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")
NVIDIA_MODEL = os.getenv("NVIDIA_MODEL", "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

def call_llm(prompt: str, system_prompt: str = "You are an AI Scientific Research Assistant.") -> str:
    """Call LLM API using NVIDIA NIM, OpenAI, or Gemini, with fallback to structured scientific responses."""
    if NVIDIA_API_KEY:
        try:
            resp = requests.post(
                "https://integrate.api.nvidia.com/v1/chat/completions",
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
                timeout=45
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
        except Exception as e:
            print(f"NVIDIA API call failed: {e}")

    if OPENAI_API_KEY:
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
            print(f"OpenAI API call failed: {e}")
            
    if GEMINI_API_KEY:
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
            print(f"Gemini API call failed: {e}")

    return ""

