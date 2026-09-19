import os
import shutil
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import models, database
from app.schemas import schemas
from app.services.document_service import extract_text_from_file

router = APIRouter(prefix="/api/projects/{project_id}/documents", tags=["documents"])
UPLOAD_DIR = os.path.join(os.getcwd(), "uploads")

@router.post("", response_model=schemas.DocumentOut)
def upload_document(project_id: int, file: UploadFile = File(...), db: Session = Depends(database.get_db)):
    proj = db.query(models.ResearchProject).filter(models.ResearchProject.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    file_path = os.path.join(UPLOAD_DIR, f"doc_{project_id}_{file.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    extracted_text = extract_text_from_file(file_path)

    doc_obj = models.Document(
        project_id=project_id,
        filename=file.filename,
        file_type=os.path.splitext(file.filename)[1],
        file_path=file_path,
        extracted_text=extracted_text
    )
    db.add(doc_obj)
    db.commit()
    db.refresh(doc_obj)
    return doc_obj

@router.get("", response_model=List[schemas.DocumentOut])
def list_documents(project_id: int, db: Session = Depends(database.get_db)):
    return db.query(models.Document).filter(models.Document.project_id == project_id).all()
