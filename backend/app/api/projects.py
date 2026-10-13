import os
import shutil
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import models, database
from app.schemas import schemas

router = APIRouter(prefix="/api/projects", tags=["projects"])

UPLOAD_DIR = os.path.join(os.getcwd(), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("", response_model=schemas.ResearchProjectOut)
def create_project(project: schemas.ResearchProjectCreate, db: Session = Depends(database.get_db)):
    db_proj = models.ResearchProject(
        title=project.title,
        research_question=project.research_question,
        description=project.description,
        domain=project.domain or "Machine Learning",
        objective=project.objective,
        constraints=project.constraints,
        evaluation_metric=project.evaluation_metric or "F1 Score",
        max_iterations=project.max_iterations or 5,
        status="draft"
    )
    db.add(db_proj)
    db.commit()
    db.refresh(db_proj)
    return db_proj

@router.get("", response_model=List[schemas.ResearchProjectOut])
def list_projects(db: Session = Depends(database.get_db)):
    projects = db.query(models.ResearchProject).order_by(models.ResearchProject.created_at.desc()).all()
    return projects

@router.get("/{project_id}", response_model=schemas.ResearchProjectOut)
def get_project(project_id: int, db: Session = Depends(database.get_db)):
    proj = db.query(models.ResearchProject).filter(models.ResearchProject.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    return proj

@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(database.get_db)):
    proj = db.query(models.ResearchProject).filter(models.ResearchProject.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Delete uploaded dataset file if exists
    if proj.dataset_path and os.path.exists(proj.dataset_path):
        try:
            os.remove(proj.dataset_path)
        except Exception:
            pass

    db.delete(proj)
    db.commit()
    return {"message": f"Project {project_id} deleted successfully"}

@router.post("/{project_id}/dataset")
def upload_dataset(project_id: int, file: UploadFile = File(...), db: Session = Depends(database.get_db)):
    proj = db.query(models.ResearchProject).filter(models.ResearchProject.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    file_path = os.path.join(UPLOAD_DIR, f"proj_{project_id}_{file.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    proj.dataset_path = file_path
    db.commit()
    return {"message": "Dataset uploaded successfully", "path": file_path}
