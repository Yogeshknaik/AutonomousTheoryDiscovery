from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import models, database
from app.schemas import schemas

router = APIRouter(prefix="/api/projects/{project_id}/theories", tags=["theories"])

@router.get("", response_model=List[schemas.TheoryOut])
def list_theories(project_id: int, db: Session = Depends(database.get_db)):
    hypotheses = db.query(models.Hypothesis).filter(models.Hypothesis.project_id == project_id).all()
    hypo_ids = [h.id for h in hypotheses]
    return db.query(models.Theory).filter(models.Theory.hypothesis_id.in_(hypo_ids)).all()
