from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import models, database
from app.schemas import schemas

router = APIRouter(prefix="/api/projects/{project_id}/knowledge", tags=["knowledge"])

@router.get("", response_model=List[schemas.KnowledgeItemOut])
def get_knowledge_items(project_id: int, db: Session = Depends(database.get_db)):
    """Retrieve extracted knowledge items for the project."""
    items = db.query(models.KnowledgeItem).filter(models.KnowledgeItem.project_id == project_id).all()
    return items

@router.get("/graph")
def get_knowledge_graph(project_id: int, db: Session = Depends(database.get_db)):
    """Retrieve knowledge graph nodes and relationships extracted from actual literature."""
    entities = db.query(models.KnowledgeEntity).filter(models.KnowledgeEntity.project_id == project_id).all()
    nodes = [{"id": e.id, "name": e.name, "type": e.entity_type, "description": e.description} for e in entities]
    ids = {e.id for e in entities}
    rels = db.query(models.KnowledgeRelationship).filter(
        models.KnowledgeRelationship.source_entity_id.in_(ids)
    ).all() if ids else []
    links = [
        {"source": r.source_entity_id, "target": r.target_entity_id, "label": r.relationship}
        for r in rels if r.target_entity_id in ids
    ]
    return {"nodes": nodes, "links": links}
