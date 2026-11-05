from fastapi import APIRouter
from app.services import llm_service

router = APIRouter(prefix="/api/llm", tags=["llm"])


@router.get("/status")
def llm_status():
    """Network/provider state and cache statistics, for the UI status indicator."""
    return llm_service.get_status()


@router.delete("/cache")
def llm_clear_cache():
    """Remove all cached LLM responses."""
    return {"deleted": llm_service.clear_cache()}
