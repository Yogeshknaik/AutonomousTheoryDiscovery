from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import models, database
from app.engine.discovery_engine import run_closed_loop_discovery

router = APIRouter(prefix="/api/projects/{project_id}/discover", tags=["discovery"])

@router.post("")
def start_discovery_pipeline(project_id: int, background_tasks: BackgroundTasks, db: Session = Depends(database.get_db)):
    proj = db.query(models.ResearchProject).filter(models.ResearchProject.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    # Run discovery synchronously or in background
    result = run_closed_loop_discovery(project_id, db)
    return {"message": "Discovery pipeline executed successfully", "result": result}
