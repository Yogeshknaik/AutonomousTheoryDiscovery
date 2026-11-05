import os
import json
import time
import random
import sqlite3
import hashlib
import threading
import requests
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

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

NVIDIA_MAX_TOKENS = int(os.getenv("NVIDIA_MAX_TOKENS", "16384"))
# Reasoning tokens count against max_tokens, so the budget must stay well below it
NVIDIA_REASONING_BUDGET = int(os.getenv("NVIDIA_REASONING_BUDGET", "4096"))
NVIDIA_TIMEOUT = int(os.getenv("NVIDIA_TIMEOUT", "600"))

# Maximum attempts per provider for LLM calls (retried with exponential backoff on network/server errors)
MAX_RETRIES = int(os.getenv("LLM_MAX_RETRIES", "4"))
BACKOFF_BASE_SECONDS = float(os.getenv("LLM_BACKOFF_BASE_SECONDS", "2"))
LLM_CACHE_ENABLED = os.getenv("LLM_CACHE_ENABLED", "true").lower() in ("1", "true", "yes")
LLM_CACHE_TTL_SECONDS = int(os.getenv("LLM_CACHE_TTL_SECONDS", "0"))  # 0 = never expires

_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
CACHE_PATH = os.getenv("LLM_CACHE_PATH", os.path.join(_BACKEND_DIR, "llm_cache.sqlite"))

_lock = threading.Lock()
_status: Dict[str, Any] = {
    "online": None,            # None = not contacted yet, True/False after the last network attempt
    "last_provider": None,
    "last_error": None,
    "last_success_at": None,
    "network_calls": 0,
    "cache_hits": 0,
    "cache_fallbacks": 0,      # answers served from cache because the network failed
}


# ---------------------------------------------------------------- cache ----
def _cache_conn() -> Optional[sqlite3.Connection]:
    try:
        conn = sqlite3.connect(CACHE_PATH, timeout=10, check_same_thread=False)
        conn.execute(
            "CREATE TABLE IF NOT EXISTS llm_cache ("
            "key TEXT PRIMARY KEY, response TEXT NOT NULL, provider TEXT, created_at REAL NOT NULL)"
        )
        return conn
    except Exception as e:
        print(f"LLM cache unavailable: {e}")
        return None


def _cache_key(prompt: str, system_prompt: str) -> str:
    return hashlib.sha256(f"{system_prompt}\n\x1f\n{prompt}".encode("utf-8")).hexdigest()


def _cache_get(key: str) -> Optional[str]:
    if not LLM_CACHE_ENABLED:
        return None
    conn = _cache_conn()
    if conn is None:
        return None
    try:
        row = conn.execute("SELECT response, created_at FROM llm_cache WHERE key = ?", (key,)).fetchone()
        if not row:
            return None
        if LLM_CACHE_TTL_SECONDS and time.time() - row[1] > LLM_CACHE_TTL_SECONDS:
            return None
        return row[0]
    except Exception as e:
        print(f"LLM cache read failed: {e}")
        return None
    finally:
        conn.close()


def _cache_put(key: str, response: str, provider: str) -> None:
    if not LLM_CACHE_ENABLED:
        return
    conn = _cache_conn()
    if conn is None:
        return
    try:
        with conn:
            conn.execute(
                "INSERT OR REPLACE INTO llm_cache (key, response, provider, created_at) VALUES (?, ?, ?, ?)",
                (key, response, provider, time.time()),
            )
    except Exception as e:
        print(f"LLM cache write failed: {e}")
    finally:
        conn.close()


def get_cache_stats() -> Dict[str, Any]:
    conn = _cache_conn()
    entries = 0
    if conn is not None:
        try:
            entries = conn.execute("SELECT COUNT(*) FROM llm_cache").fetchone()[0]
        except Exception:
            pass
        finally:
            conn.close()
    return {"enabled": LLM_CACHE_ENABLED, "entries": entries, "path": CACHE_PATH, "ttl_seconds": LLM_CACHE_TTL_SECONDS}


def clear_cache() -> int:
    conn = _cache_conn()
    if conn is None:
        return 0
    try:
        with conn:
            cur = conn.execute("DELETE FROM llm_cache")
            return cur.rowcount
    finally:
        conn.close()


def get_status() -> Dict[str, Any]:
    with _lock:
        status = dict(_status)
    status["cache"] = get_cache_stats()
    status["providers_configured"] = {
        "nvidia": bool(NVIDIA_API_KEY and NVIDIA_MODEL),
        "openai": bool(OPENAI_API_KEY),
        "gemini": bool(GEMINI_API_KEY),
    }
    return status


def _record(**updates) -> None:
    with _lock:
        _status.update(updates)


def _bump(counter: str) -> None:
    with _lock:
        _status[counter] = _status.get(counter, 0) + 1


# ------------------------------------------------------------- network ----
def _backoff(attempt: int) -> None:
    # attempt is 0-based; waits 2s, 4s, 8s ... with jitter
    time.sleep(BACKOFF_BASE_SECONDS * (2 ** attempt) * (0.8 + 0.4 * random.random()))


def _try_provider(name: str, send) -> Optional[str]:
    """Run `send()` (returns text or None) with retries. Network/server failures are retried; None means give up."""
    for attempt in range(MAX_RETRIES):
        _bump("network_calls")
        try:
            text = send()
            if text and text.strip():
                _record(online=True, last_provider=name, last_error=None, last_success_at=datetime.now(timezone.utc).isoformat())
                return text
            _record(last_error=f"{name}: empty response")
            return None  # a valid but empty answer will not improve on retry
        except requests.exceptions.RequestException as e:
            # Connection drops, timeouts, DNS failures, 429/5xx (raised as RetryableError) -> retry
            msg = f"{name} network error (attempt {attempt + 1}/{MAX_RETRIES}): {e}"
            print(msg)
            _record(online=False, last_error=msg)
        except RetryableError as e:
            msg = f"{name} transient error (attempt {attempt + 1}/{MAX_RETRIES}): {e}"
            print(msg)
            _record(online=False, last_error=msg)
        except Exception as e:
            # Auth errors, malformed payloads, etc. — retrying will not help
            msg = f"{name} failed: {e}"
            print(msg)
            _record(last_error=msg)
            return None
        if attempt < MAX_RETRIES - 1:
            _backoff(attempt)
    return None


class RetryableError(Exception):
    pass


def _check_status(resp: requests.Response) -> None:
    if resp.status_code == 200:
        return
    if resp.status_code == 429 or resp.status_code >= 500:
        raise RetryableError(f"HTTP {resp.status_code}: {resp.text[:200]}")
    raise ValueError(f"HTTP {resp.status_code}: {resp.text[:200]}")


def _send_nvidia(prompt: str, system_prompt: str) -> Optional[str]:
    resp = requests.post(
        f"{NVIDIA_BASE_URL}/chat/completions",
        headers={"Authorization": f"Bearer {NVIDIA_API_KEY}", "Content-Type": "application/json"},
        json={
            "model": NVIDIA_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.6,
            "top_p": 0.95,
            "max_tokens": NVIDIA_MAX_TOKENS,
            "reasoning_budget": NVIDIA_REASONING_BUDGET
        },
        timeout=(10, NVIDIA_TIMEOUT)
    )
    _check_status(resp)
    data = resp.json()
    if "choices" in data and len(data["choices"]) > 0:
        msg = data["choices"][0]["message"]
        content = msg.get("content")
        if content and content.strip():
            return content
        reasoning = msg.get("reasoning_content")
        if reasoning and reasoning.strip():
            return reasoning
    return None


def _send_openai(prompt: str, system_prompt: str) -> Optional[str]:
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
    _check_status(resp)
    return resp.json()["choices"][0]["message"]["content"]


def _send_gemini(prompt: str, system_prompt: str) -> Optional[str]:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
    resp = requests.post(
        url,
        json={"contents": [{"parts": [{"text": f"{system_prompt}\n\n{prompt}"}]}]},
        timeout=30
    )
    _check_status(resp)
    return resp.json()["candidates"][0]["content"]["parts"][0]["text"]


def call_llm(prompt: str, system_prompt: str = "You are an AI Scientific Research Assistant.", force_refresh: bool = False) -> str:
    """
    Call the LLM with this order of preference:
      1. Cached answer for the identical prompt (skipped when force_refresh=True)
      2. NVIDIA NIM, then OpenAI, then Gemini — each retried with exponential backoff
      3. If every provider is unreachable and force_refresh was set, the older cached answer is used.
         Otherwise an empty string is returned and the status endpoint reports why.
    Successful answers are written to the cache so repeated runs work offline.
    """
    key = _cache_key(prompt, system_prompt)

    if not force_refresh:
        cached = _cache_get(key)
        if cached is not None:
            _bump("cache_hits")
            return cached

    providers = []
    if NVIDIA_API_KEY and NVIDIA_MODEL:
        providers.append(("NVIDIA NIM", _send_nvidia))
    if OPENAI_API_KEY:
        providers.append(("OpenAI", _send_openai))
    if GEMINI_API_KEY:
        providers.append(("Gemini", _send_gemini))

    for name, send in providers:
        text = _try_provider(name, lambda s=send: s(prompt, system_prompt))
        if text:
            _cache_put(key, text, name)
            return text

    if force_refresh:
        # Network failed on a forced refresh: fall back to the older cached answer rather than nothing
        cached = _cache_get(key)
        if cached is not None:
            _bump("cache_fallbacks")
            return cached

    if not providers:
        _record(last_error="No LLM provider configured. Set NVIDIA_API_KEY and NVIDIA_MODEL in .env.")
    print("WARNING: All LLM providers failed or no API keys configured. Check your .env file and network.")
    return ""
