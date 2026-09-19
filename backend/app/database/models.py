from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=True)
    role = Column(String, default="researcher")
    created_at = Column(DateTime, default=datetime.utcnow)

class ResearchProject(Base):
    __tablename__ = "research_projects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    title = Column(String, nullable=False)
    research_question = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    domain = Column(String, default="Machine Learning")
    objective = Column(Text, nullable=True)
    constraints = Column(Text, nullable=True)
    evaluation_metric = Column(String, default="F1 Score")
    max_iterations = Column(Integer, default=5)
    current_iteration = Column(Integer, default=0)
    status = Column(String, default="draft")  # draft, running, completed, failed
    dataset_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    documents = relationship("Document", back_populates="project", cascade="all, delete-orphan")
    knowledge_items = relationship("KnowledgeItem", back_populates="project", cascade="all, delete-orphan")
    entities = relationship("KnowledgeEntity", back_populates="project", cascade="all, delete-orphan")
    hypotheses = relationship("Hypothesis", back_populates="project", cascade="all, delete-orphan")
    experiments = relationship("Experiment", back_populates="project", cascade="all, delete-orphan")
    memories = relationship("DiscoveryMemory", back_populates="project", cascade="all, delete-orphan")

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("research_projects.id"))
    filename = Column(String, nullable=False)
    file_type = Column(String, nullable=True)
    file_path = Column(String, nullable=True)
    extracted_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("ResearchProject", back_populates="documents")

class KnowledgeItem(Base):
    __tablename__ = "knowledge_items"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("research_projects.id"))
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    title = Column(String, nullable=True)
    content = Column(Text, nullable=False)
    knowledge_type = Column(String, default="extracted_concept")
    relevance_score = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("ResearchProject", back_populates="knowledge_items")

class KnowledgeEntity(Base):
    __tablename__ = "knowledge_entities"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("research_projects.id"))
    name = Column(String, nullable=False)
    entity_type = Column(String, nullable=True)
    description = Column(Text, nullable=True)

    project = relationship("ResearchProject", back_populates="entities")

class KnowledgeRelationship(Base):
    __tablename__ = "knowledge_relationships"

    id = Column(Integer, primary_key=True, index=True)
    source_entity_id = Column(Integer, ForeignKey("knowledge_entities.id"))
    target_entity_id = Column(Integer, ForeignKey("knowledge_entities.id"))
    relationship = Column(String, nullable=False)

class Hypothesis(Base):
    __tablename__ = "hypotheses"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("research_projects.id"))
    iteration = Column(Integer, default=1)
    title = Column(String, nullable=False)
    statement = Column(Text, nullable=False)
    reasoning = Column(Text, nullable=True)
    expected_effect = Column(Text, nullable=True)

    plausibility_score = Column(Float, default=0.0)
    novelty_score = Column(Float, default=0.0)
    testability_score = Column(Float, default=0.0)
    consistency_score = Column(Float, default=0.0)
    overall_score = Column(Float, default=0.0)

    status = Column(String, default="generated") # generated, ranked, selected, converted, evaluated, rejected, refined, validated

    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("ResearchProject", back_populates="hypotheses")
    theories = relationship("Theory", back_populates="hypothesis", cascade="all, delete-orphan")

class Theory(Base):
    __tablename__ = "theories"

    id = Column(Integer, primary_key=True, index=True)
    hypothesis_id = Column(Integer, ForeignKey("hypotheses.id"))
    theory_title = Column(String, nullable=False)
    theory_description = Column(Text, nullable=True)
    mathematical_expression = Column(Text, nullable=True)
    algorithm_description = Column(Text, nullable=True)
    assumptions = Column(Text, nullable=True)
    constraints = Column(Text, nullable=True)
    consistency_status = Column(String, default="PENDING") # PASS, FAIL, WARNING
    created_at = Column(DateTime, default=datetime.utcnow)

    hypothesis = relationship("Hypothesis", back_populates="theories")
    experiments = relationship("Experiment", back_populates="theory", cascade="all, delete-orphan")
    validations = relationship("Validation", back_populates="theory", cascade="all, delete-orphan")

class Experiment(Base):
    __tablename__ = "experiments"

    id = Column(Integer, primary_key=True, index=True)
    theory_id = Column(Integer, ForeignKey("theories.id"))
    project_id = Column(Integer, ForeignKey("research_projects.id"))
    experiment_name = Column(String, nullable=False)
    dataset_name = Column(String, nullable=True)
    experiment_code = Column(Text, nullable=True)
    configuration = Column(Text, nullable=True)
    status = Column(String, default="pending") # pending, running, completed, failed
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)

    theory = relationship("Theory", back_populates="experiments")
    project = relationship("ResearchProject", back_populates="experiments")
    results = relationship("ExperimentResult", back_populates="experiment", cascade="all, delete-orphan")

class ExperimentResult(Base):
    __tablename__ = "experiment_results"

    id = Column(Integer, primary_key=True, index=True)
    experiment_id = Column(Integer, ForeignKey("experiments.id"))

    accuracy = Column(Float, nullable=True)
    precision_score = Column(Float, nullable=True)
    recall_score = Column(Float, nullable=True)
    f1_score = Column(Float, nullable=True)

    mae = Column(Float, nullable=True)
    mse = Column(Float, nullable=True)
    rmse = Column(Float, nullable=True)
    r2_score = Column(Float, nullable=True)

    baseline_f1 = Column(Float, nullable=True)
    baseline_accuracy = Column(Float, nullable=True)

    execution_time = Column(Float, nullable=True)
    raw_output = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    experiment = relationship("Experiment", back_populates="results")

class Validation(Base):
    __tablename__ = "validations"

    id = Column(Integer, primary_key=True, index=True)
    theory_id = Column(Integer, ForeignKey("theories.id"))

    consistency_score = Column(Float, default=0.0)
    agreement_score = Column(Float, default=0.0)
    novelty_score = Column(Float, default=0.0)
    reproducibility_score = Column(Float, default=0.0)

    validation_score = Column(Float, default=0.0)

    decision = Column(String, default="rejected") # validated, refine, reject
    explanation = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    theory = relationship("Theory", back_populates="validations")

class DiscoveryMemory(Base):
    __tablename__ = "discovery_memory"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("research_projects.id"))
    iteration = Column(Integer, default=1)
    memory_type = Column(String, default="failed_hypothesis") # failed_hypothesis, successful_candidate, observation
    content = Column(Text, nullable=False)
    source_id = Column(Integer, nullable=True)
    importance_score = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("ResearchProject", back_populates="memories")

class RefinementCycle(Base):
    __tablename__ = "refinement_cycles"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("research_projects.id"))
    previous_hypothesis_id = Column(Integer, nullable=True)
    new_hypothesis_id = Column(Integer, nullable=True)
    reason = Column(Text, nullable=True)
    evidence = Column(Text, nullable=True)
    iteration = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
