import os
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import models, database
from app.engine.discovery_engine import run_discovery_in_background

router = APIRouter(prefix="/api/projects/{project_id}/discover", tags=["discovery"])

@router.post("", status_code=202)
def start_discovery_pipeline(project_id: int, background_tasks: BackgroundTasks, db: Session = Depends(database.get_db)):
    proj = db.query(models.ResearchProject).filter(models.ResearchProject.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    if proj.status == "running":
        raise HTTPException(status_code=409, detail="Discovery is already running for this project")
    if not proj.dataset_path or not os.path.exists(proj.dataset_path):
        raise HTTPException(status_code=400, detail="Dataset required: upload a .csv dataset before running discovery.")

    proj.status = "running"
    db.commit()
    background_tasks.add_task(run_discovery_in_background, project_id)
    return {"message": "Discovery pipeline started", "project_id": project_id, "status": "running"}
