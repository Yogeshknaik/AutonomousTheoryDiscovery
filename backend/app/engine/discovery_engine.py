import os
import json
from datetime import datetime
from sqlalchemy.orm import Session

from app.database import models
from app.services import (
    document_service,
    retrieval_service,
    hypothesis_service,
    theory_service,
    experiment_service,
    validation_service,
    memory_service
)

def run_closed_loop_discovery(project_id: int, db: Session):
    """
    Executes the autonomous discovery pipeline:
    Problem -> Knowledge -> Hypotheses -> Ranking -> Theory -> Consistency -> Experiment -> Validation -> Memory -> Refinement -> Final Candidate
    """
    project = db.query(models.ResearchProject).filter(models.ResearchProject.id == project_id).first()
    if not project:
        return {"error": "Project not found"}

    project.status = "running"
    db.commit()

    # Default fallback dataset if none uploaded
    dataset_path = project.dataset_path
    if not dataset_path or not os.path.exists(dataset_path):
        sample_dir = os.path.join(os.getcwd(), "uploads")
        os.makedirs(sample_dir, exist_ok=True)
        dataset_path = os.path.join(sample_dir, "sample_heart.csv")
        
        # Create standard ML benchmark dataset (Heart Disease dataset mock)
        import pandas as pd
        import numpy as np
        np.random.seed(42)
        n = 300
        df = pd.DataFrame({
            "age": np.random.randint(29, 77, n),
            "sex": np.random.randint(0, 2, n),
            "cp": np.random.randint(0, 4, n),
            "trestbps": np.random.randint(94, 200, n),
            "chol": np.random.randint(126, 564, n),
            "fbs": np.random.randint(0, 2, n),
            "restecg": np.random.randint(0, 3, n),
            "thalach": np.random.randint(71, 202, n),
            "exang": np.random.randint(0, 2, n),
            "oldpeak": np.round(np.random.uniform(0, 6.2, n), 1),
            "slope": np.random.randint(0, 3, n),
            "ca": np.random.randint(0, 5, n),
            "noise_feature_1": np.random.normal(0, 1, n),
            "noise_feature_2": np.random.normal(0, 1, n),
            "noise_feature_3": np.random.normal(0, 1, n),
            "target": np.random.randint(0, 2, n)
        })
        df.to_csv(dataset_path, index=False)
        project.dataset_path = dataset_path
        db.commit()

    # Step 1: Document Processing & Knowledge Extraction
    docs = db.query(models.Document).filter(models.Document.project_id == project_id).all()
    docs_text = [doc.extracted_text for doc in docs if doc.extracted_text]
    if not docs_text:
        default_knowledge_text = """
        Feature selection plays a crucial role in high-dimensional classification problems.
        Mutual information measures the mutual dependence between the variables, capturing non-linear relationships.
        Random Forest models produce Gini impurity-based feature importances which reflect structural model decision splits.
        Combining statistical dependence metrics with model-based importances can prune noisy attributes while preserving strong signal.
        """
        docs_text = [default_knowledge_text]

    # Retrieve relevant knowledge
    retrieved_k = retrieval_service.retrieve_relevant_knowledge(project.research_question, docs_text)
    k_summary = "\n".join([k["text"] for k in retrieved_k])

    # Store Knowledge Graph Entities
    entities = retrieval_service.extract_knowledge_entities(k_summary)
    for ent in entities:
        existing = db.query(models.KnowledgeEntity).filter(
            models.KnowledgeEntity.project_id == project_id,
            models.KnowledgeEntity.name == ent["name"]
        ).first()
        if not existing:
            db.add(models.KnowledgeEntity(
                project_id=project_id,
                name=ent["name"],
                entity_type=ent["type"],
                description=ent["description"]
            ))
    db.commit()

    # Closed-loop iterations
    max_iters = project.max_iterations or 3
    validated_candidate = None

    for iter_idx in range(1, max_iters + 1):
        project.current_iteration = iter_idx
        db.commit()

        # Fetch previous failed hypothesis memories
        past_memories = db.query(models.DiscoveryMemory).filter(
            models.DiscoveryMemory.project_id == project_id,
            models.DiscoveryMemory.memory_type == "failed_hypothesis"
        ).all()
        failures = [m.content for m in past_memories]

        # Step 2: Hypothesis Generation & Ranking
        hypo_dicts = hypothesis_service.generate_and_rank_hypotheses(
            problem_title=project.title,
            research_question=project.research_question,
            retrieved_knowledge=k_summary,
            previous_failures=failures,
            iteration=iter_idx
        )

        db_hypotheses = []
        for hd in hypo_dicts:
            hypo_obj = models.Hypothesis(
                project_id=project_id,
                iteration=iter_idx,
                title=hd["title"],
                statement=hd["hypothesis"],
                reasoning=hd.get("reasoning"),
                expected_effect=hd.get("expected_effect"),
                plausibility_score=hd["plausibility"],
                novelty_score=hd["novelty"],
                testability_score=hd["testability"],
                consistency_score=hd["consistency"],
                overall_score=hd["overall_score"],
                status="ranked"
            )
            db.add(hypo_obj)
            db.commit()
            db.refresh(hypo_obj)
            db_hypotheses.append(hypo_obj)

        # Select highest-ranked candidate hypothesis
        selected_hypo = db_hypotheses[0]
        selected_hypo.status = "selected"
        db.commit()

        # Step 3: Theory Construction & Consistency Verification
        selected_hd = hypo_dicts[0]
        theory_data = theory_service.construct_and_validate_theory(selected_hd, f"Dataset path: {dataset_path}")
        
        theory_obj = models.Theory(
            hypothesis_id=selected_hypo.id,
            theory_title=theory_data["theory_title"],
            theory_description=theory_data["theory_description"],
            mathematical_expression=theory_data.get("mathematical_expression"),
            algorithm_description=theory_data.get("algorithm_description"),
            assumptions=theory_data.get("assumptions"),
            constraints=theory_data.get("constraints"),
            consistency_status=theory_data.get("consistency_status", "PASS")
        )
        db.add(theory_obj)
        db.commit()
        db.refresh(theory_obj)

        # Step 4: Experiment Code Generation & Execution
        code = experiment_service.generate_experiment_code(theory_data, dataset_path)
        exp_obj = models.Experiment(
            theory_id=theory_obj.id,
            project_id=project_id,
            experiment_name=f"Experiment_{selected_hypo.id}_Iter{iter_idx}",
            dataset_name=os.path.basename(dataset_path),
            experiment_code=code,
            status="running",
            started_at=datetime.utcnow()
        )
        db.add(exp_obj)
        db.commit()
        db.refresh(exp_obj)

        exp_results, stdout, err_msg = experiment_service.execute_experiment_code(code)
        
        exp_obj.completed_at = datetime.utcnow()
        if err_msg:
            exp_obj.status = "failed"
            exp_obj.error_message = err_msg
        else:
            exp_obj.status = "completed"
        db.commit()

        # Save experiment metrics
        result_obj = models.ExperimentResult(
            experiment_id=exp_obj.id,
            accuracy=exp_results.get("accuracy"),
            precision_score=exp_results.get("precision_score"),
            recall_score=exp_results.get("recall_score"),
            f1_score=exp_results.get("f1_score"),
            baseline_f1=exp_results.get("baseline_f1"),
            baseline_accuracy=exp_results.get("baseline_accuracy"),
            mae=exp_results.get("mae"),
            mse=exp_results.get("mse"),
            rmse=exp_results.get("rmse"),
            execution_time=exp_results.get("execution_time"),
            raw_output=stdout
        )
        db.add(result_obj)
        db.commit()

        # Step 5: Composite Theory Candidate Validation
        val_data, decision, explanation = validation_service.validate_theory_candidate(
            theory_data, selected_hd, exp_results, err_msg
        )

        val_obj = models.Validation(
            theory_id=theory_obj.id,
            consistency_score=val_data["consistency_score"],
            agreement_score=val_data["agreement_score"],
            novelty_score=val_data["novelty_score"],
            reproducibility_score=val_data["reproducibility_score"],
            validation_score=val_data["validation_score"],
            decision=decision,
            explanation=explanation
        )
        db.add(val_obj)
        db.commit()

        # Step 6: Discovery Memory & Failure Feedback Refinement
        if decision == "validated":
            selected_hypo.status = "validated"
            db.commit()
            memory_service.record_memory(
                db, project_id, iter_idx, "successful_candidate",
                f"Validated Hypothesis '{selected_hypo.title}' with F1={exp_results.get('f1_score'):.3f} vs Baseline F1={exp_results.get('baseline_f1'):.3f} (+{(exp_results.get('f1_score')-exp_results.get('baseline_f1'))/exp_results.get('baseline_f1')*100:.2f}%)."
            )
            validated_candidate = {
                "hypothesis": selected_hypo,
                "theory": theory_obj,
                "experiment": exp_obj,
                "result": result_obj,
                "validation": val_obj
            }
            break
        elif decision == "refine":
            selected_hypo.status = "refined"
            db.commit()
            memory_service.record_memory(
                db, project_id, iter_idx, "failed_hypothesis",
                f"Iteration {iter_idx} hypothesis '{selected_hypo.title}' gave marginal results (F1={exp_results.get('f1_score', 0):.3f}). Need quantile threshold tuning."
            )
            # Create Refinement Cycle record
            db.add(models.RefinementCycle(
                project_id=project_id,
                previous_hypothesis_id=selected_hypo.id,
                reason="Marginal metrics improvement; threshold requires refinement",
                evidence=f"Baseline F1: {exp_results.get('baseline_f1')}, Proposed F1: {exp_results.get('f1_score')}",
                iteration=iter_idx
            ))
            db.commit()
        else: # reject
            selected_hypo.status = "rejected"
            db.commit()
            memory_service.record_memory(
                db, project_id, iter_idx, "failed_hypothesis",
                f"Iteration {iter_idx} hypothesis '{selected_hypo.title}' was rejected: {explanation}"
            )

    project.status = "completed"
    db.commit()

    return {
        "project_id": project_id,
        "status": "completed",
        "iterations_completed": project.current_iteration,
        "validated_candidate": validated_candidate is not None
    }
