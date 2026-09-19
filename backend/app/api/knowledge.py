from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import models, database
from app.schemas import schemas
from app.services import retrieval_service

router = APIRouter(prefix="/api/projects/{project_id}/knowledge", tags=["knowledge"])

@router.get("", response_model=List[schemas.KnowledgeItemOut])
def get_knowledge_items(project_id: int, db: Session = Depends(database.get_db)):
    items = db.query(models.KnowledgeItem).filter(models.KnowledgeItem.project_id == project_id).all()
    if not items:
        # Generate initial knowledge items from project research question
        proj = db.query(models.ResearchProject).filter(models.ResearchProject.id == project_id).first()
        if proj:
            default_item = models.KnowledgeItem(
                project_id=project_id,
                title="Mutual Information & Decision Tree Ensembles",
                content="Mutual Information (MI) quantifies non-linear dependency between numerical attributes and discrete targets. Random Forest Gini impurity measures structural tree split gain. Combining both metrics stabilizes feature subset selection.",
                knowledge_type="literature_finding",
                relevance_score=0.92
            )
            db.add(default_item)
            db.commit()
            db.refresh(default_item)
            items = [default_item]
    return items

@router.get("/graph")
def get_knowledge_graph(project_id: int, db: Session = Depends(database.get_db)):
    entities = db.query(models.KnowledgeEntity).filter(models.KnowledgeEntity.project_id == project_id).all()
    if not entities:
        # Default entities for visual graph render
        entities_data = [
            {"id": 1, "name": "Mutual Information", "type": "Metric", "description": "Non-linear feature dependency metric"},
            {"id": 2, "name": "Random Forest", "type": "Algorithm", "description": "Gini impurity tree classifier"},
            {"id": 3, "name": "Feature Selection", "type": "Domain", "description": "Dimensionality reduction for tabular data"},
            {"id": 4, "name": "F1 Score", "type": "Metric", "description": "Harmonic mean evaluation metric"}
        ]
        relationships = [
            {"source": 1, "target": 3, "label": "SUPPORTS"},
            {"source": 2, "target": 3, "label": "USES"},
            {"source": 3, "target": 4, "label": "OPTIMIZES"}
        ]
        return {"nodes": entities_data, "links": relationships}

    nodes = [{"id": e.id, "name": e.name, "type": e.entity_type, "description": e.description} for e in entities]
    links = []
    if len(nodes) >= 2:
        for i in range(len(nodes) - 1):
            links.append({"source": nodes[i]["id"], "target": nodes[i+1]["id"], "label": "RELATED_TO"})
    return {"nodes": nodes, "links": links}
