from sqlalchemy.orm import Session
from app.database import models

def record_memory(
    db: Session,
    project_id: int,
    iteration: int,
    memory_type: str,
    content: str,
    importance_score: float = 1.0
):
    mem = models.DiscoveryMemory(
        project_id=project_id,
        iteration=iteration,
        memory_type=memory_type,
        content=content,
        importance_score=importance_score
    )
    db.add(mem)
    db.commit()
    db.refresh(mem)
    return mem

def get_project_memories(db: Session, project_id: int):
    return db.query(models.DiscoveryMemory).filter(
        models.DiscoveryMemory.project_id == project_id
    ).order_by(models.DiscoveryMemory.created_at.asc()).all()
