from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import models, database
from app.schemas import schemas

router = APIRouter(prefix="/api/projects/{project_id}/memory", tags=["memory"])

@router.get("", response_model=List[schemas.DiscoveryMemoryOut])
def list_memories(project_id: int, db: Session = Depends(database.get_db)):
    return db.query(models.DiscoveryMemory).filter(models.DiscoveryMemory.project_id == project_id).order_by(models.DiscoveryMemory.created_at.asc()).all()
