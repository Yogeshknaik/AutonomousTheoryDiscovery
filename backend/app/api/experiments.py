from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import models, database
from app.schemas import schemas

router = APIRouter(prefix="/api/projects/{project_id}/experiments", tags=["experiments"])

@router.get("", response_model=List[schemas.ExperimentOut])
def list_experiments(project_id: int, db: Session = Depends(database.get_db)):
    return db.query(models.Experiment).filter(models.Experiment.project_id == project_id).order_by(models.Experiment.id.desc()).all()
