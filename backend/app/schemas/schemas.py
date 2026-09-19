from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field

# User Schemas
class UserBase(BaseModel):
    name: str
    email: str
    role: Optional[str] = "researcher"

class UserCreate(UserBase):
    password: Optional[str] = None

class UserOut(UserBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# Research Project Schemas
class ResearchProjectCreate(BaseModel):
    title: str
    research_question: str
    description: Optional[str] = None
    domain: Optional[str] = "Machine Learning"
    objective: Optional[str] = None
    constraints: Optional[str] = None
    evaluation_metric: Optional[str] = "F1 Score"
    max_iterations: Optional[int] = 5

class ResearchProjectOut(ResearchProjectCreate):
    id: int
    user_id: Optional[int] = None
    current_iteration: int
    status: str
    dataset_path: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

# Document & Knowledge Schemas
class DocumentOut(BaseModel):
    id: int
    project_id: int
    filename: str
    file_type: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

class KnowledgeItemOut(BaseModel):
    id: int
    project_id: int
    title: Optional[str] = None
    content: str
    knowledge_type: str
    relevance_score: float
    created_at: datetime
    class Config:
        from_attributes = True

class KnowledgeEntityOut(BaseModel):
    id: int
    name: str
    entity_type: Optional[str] = None
    description: Optional[str] = None
    class Config:
        from_attributes = True

class KnowledgeRelationshipOut(BaseModel):
    id: int
    source_entity_id: int
    target_entity_id: int
    relationship: str
    class Config:
        from_attributes = True

# Hypothesis & Theory Schemas
class HypothesisOut(BaseModel):
    id: int
    project_id: int
    iteration: int
    title: str
    statement: str
    reasoning: Optional[str] = None
    expected_effect: Optional[str] = None
    plausibility_score: float
    novelty_score: float
    testability_score: float
    consistency_score: float
    overall_score: float
    status: str
    created_at: datetime
    class Config:
        from_attributes = True

class TheoryOut(BaseModel):
    id: int
    hypothesis_id: int
    theory_title: str
    theory_description: Optional[str] = None
    mathematical_expression: Optional[str] = None
    algorithm_description: Optional[str] = None
    assumptions: Optional[str] = None
    constraints: Optional[str] = None
    consistency_status: str
    created_at: datetime
    class Config:
        from_attributes = True

# Experiment & Result Schemas
class ExperimentResultOut(BaseModel):
    id: int
    experiment_id: int
    accuracy: Optional[float] = None
    precision_score: Optional[float] = None
    recall_score: Optional[float] = None
    f1_score: Optional[float] = None
    baseline_f1: Optional[float] = None
    baseline_accuracy: Optional[float] = None
    mae: Optional[float] = None
    mse: Optional[float] = None
    rmse: Optional[float] = None
    r2_score: Optional[float] = None
    execution_time: Optional[float] = None
    raw_output: Optional[str] = None
    class Config:
        from_attributes = True

class ExperimentOut(BaseModel):
    id: int
    theory_id: int
    project_id: int
    experiment_name: str
    dataset_name: Optional[str] = None
    experiment_code: Optional[str] = None
    status: str
    error_message: Optional[str] = None
    results: List[ExperimentResultOut] = []
    class Config:
        from_attributes = True

# Validation Schemas
class ValidationOut(BaseModel):
    id: int
    theory_id: int
    consistency_score: float
    agreement_score: float
    novelty_score: float
    reproducibility_score: float
    validation_score: float
    decision: str
    explanation: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

# Memory & Refinement Schemas
class DiscoveryMemoryOut(BaseModel):
    id: int
    project_id: int
    iteration: int
    memory_type: str
    content: str
    importance_score: float
    created_at: datetime
    class Config:
        from_attributes = True

class RefinementCycleOut(BaseModel):
    id: int
    project_id: int
    previous_hypothesis_id: Optional[int] = None
    new_hypothesis_id: Optional[int] = None
    reason: Optional[str] = None
    evidence: Optional[str] = None
    iteration: int
    created_at: datetime
    class Config:
        from_attributes = True

# Discovery Progress Payload
class DiscoveryProgress(BaseModel):
    step: str
    message: str
    iteration: int
    status: str # running, completed, error
    details: Optional[Dict[str, Any]] = None
