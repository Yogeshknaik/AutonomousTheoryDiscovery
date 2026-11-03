import os
from typing import Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import models, database
from app.engine.discovery_engine import run_discovery_in_background

router = APIRouter(prefix="/api/projects/{project_id}/discover", tags=["discovery"])

class ValidationWeights(BaseModel):
    """V(h) = alpha*C(h) + beta*A(h) + gamma*N(h) + delta*R(h); normalised to sum 1 by the validator."""
    consistency: float = Field(0.3, ge=0, le=1)
    agreement: float = Field(0.3, ge=0, le=1)
    novelty: float = Field(0.2, ge=0, le=1)
    reproducibility: float = Field(0.2, ge=0, le=1)

class DiscoveryRequest(BaseModel):
    weights: Optional[ValidationWeights] = None

@router.post("", status_code=202)
def start_discovery_pipeline(project_id: int, background_tasks: BackgroundTasks, body: Optional[DiscoveryRequest] = None, db: Session = Depends(database.get_db)):
    proj = db.query(models.ResearchProject).filter(models.ResearchProject.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    if proj.status == "running":
        raise HTTPException(status_code=409, detail="Discovery is already running for this project")
    if not proj.dataset_path or not os.path.exists(proj.dataset_path):
        raise HTTPException(status_code=400, detail="Dataset required: upload a .csv dataset before running discovery.")

    proj.status = "running"
    db.commit()
    weights = None
    if body and body.weights:
        w = body.weights
        if w.consistency + w.agreement + w.novelty + w.reproducibility <= 0:
            raise HTTPException(status_code=400, detail="At least one validation weight must be above 0")
        weights = {"alpha": w.consistency, "beta": w.agreement, "gamma": w.novelty, "delta": w.reproducibility}
    background_tasks.add_task(run_discovery_in_background, project_id, weights)
    return {"message": "Discovery pipeline started", "project_id": project_id, "status": "running"}
