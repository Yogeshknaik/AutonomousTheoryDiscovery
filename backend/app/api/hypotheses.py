from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import models, database
from app.schemas import schemas

router = APIRouter(prefix="/api/projects/{project_id}/hypotheses", tags=["hypotheses"])

@router.get("", response_model=List[schemas.HypothesisOut])
def list_hypotheses(project_id: int, db: Session = Depends(database.get_db)):
    return db.query(models.Hypothesis).filter(models.Hypothesis.project_id == project_id).order_by(models.Hypothesis.overall_score.desc()).all()
