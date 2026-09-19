from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import models, database
from app.schemas import schemas

router = APIRouter(prefix="/api/projects/{project_id}/validations", tags=["validations"])

@router.get("", response_model=List[schemas.ValidationOut])
def list_validations(project_id: int, db: Session = Depends(database.get_db)):
    hypotheses = db.query(models.Hypothesis).filter(models.Hypothesis.project_id == project_id).all()
    hypo_ids = [h.id for h in hypotheses]
    theories = db.query(models.Theory).filter(models.Theory.hypothesis_id.in_(hypo_ids)).all()
    theory_ids = [t.id for t in theories]
    return db.query(models.Validation).filter(models.Validation.theory_id.in_(theory_ids)).all()
