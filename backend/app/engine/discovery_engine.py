import os
import json
from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session

from app.database import models
from app.services import (
    retrieval_service,
    hypothesis_service,
    theory_service,
    experiment_service,
    validation_service,
    memory_service
)

def _store_knowledge_graph(db: Session, project_id: int, text: str):
    graph = retrieval_service.extract_knowledge_graph(text)
    name_to_entity = {}
    for ent in graph["entities"]:
        entity = db.query(models.KnowledgeEntity).filter(
            models.KnowledgeEntity.project_id == project_id,
            models.KnowledgeEntity.name == ent["name"]
        ).first()
        if not entity:
            entity = models.KnowledgeEntity(
                project_id=project_id,
                name=ent["name"],
                entity_type=ent.get("type"),
                description=ent.get("description")
            )
            db.add(entity)
            db.commit()
            db.refresh(entity)
        name_to_entity[ent["name"]] = entity

    for rel in graph["relations"]:
        src = name_to_entity[rel["source"]]
        tgt = name_to_entity[rel["target"]]
        exists = db.query(models.KnowledgeRelationship).filter(
            models.KnowledgeRelationship.source_entity_id == src.id,
            models.KnowledgeRelationship.target_entity_id == tgt.id,
            models.KnowledgeRelationship.relationship == rel["relation"]
        ).first()
        if not exists:
            db.add(models.KnowledgeRelationship(
                source_entity_id=src.id,
                target_entity_id=tgt.id,
                relationship=rel["relation"]
            ))
    db.commit()

def _fail(db: Session, project: models.ResearchProject, iteration: int, message: str) -> Dict[str, Any]:
    project.status = "failed"
    db.commit()
    memory_service.record_memory(db, project.id, iteration, "pipeline_error", message)
    return {"error": message, "status": "failed"}

def run_closed_loop_discovery(project_id: int, db: Session) -> Dict[str, Any]:
    project = db.query(models.ResearchProject).filter(models.ResearchProject.id == project_id).first()
    if not project:
        return {"error": "Project not found", "status": "failed"}

    project.status = "running"
    project.current_iteration = 0
    db.commit()

    dataset_path = project.dataset_path
    if not dataset_path or not os.path.exists(dataset_path):
        return _fail(db, project, 0, "Dataset required: upload a .csv dataset before running discovery.")

    docs = db.query(models.Document).filter(models.Document.project_id == project_id).all()
    docs_text = [doc.extracted_text for doc in docs if doc.extracted_text]

    if docs_text:
        retrieved = retrieval_service.retrieve_relevant_knowledge(project.research_question, docs_text)
        for item in retrieved:
            db.add(models.KnowledgeItem(
                project_id=project_id,
                title=f"Retrieved passage (score {item['score']:.3f})",
                content=item["text"],
                knowledge_type="retrieved_passage",
                relevance_score=item["score"]
            ))
        db.commit()
        k_summary = "\n".join(item["text"] for item in retrieved)
    else:
        k_summary = (
            f"Research Problem: {project.title}\n"
            f"Research Question: {project.research_question}\n"
            f"Domain: {project.domain or 'Machine Learning'}"
        )

    _store_knowledge_graph(db, project_id, k_summary)

    max_iters = project.max_iterations or 3
    validated_candidate = None
    refinement_target: Optional[Dict[str, Any]] = None
    pending_cycle: Optional[models.RefinementCycle] = None

    for iter_idx in range(1, max_iters + 1):
        project.current_iteration = iter_idx
        db.commit()

        memories = db.query(models.DiscoveryMemory).filter(models.DiscoveryMemory.project_id == project_id).all()
        successes = [m.content for m in memories if m.memory_type == "successful_candidate"]
        failures = [m.content for m in memories if m.memory_type == "failed_hypothesis"]

        hypo_dicts = hypothesis_service.generate_and_rank_hypotheses(
            problem_title=project.title,
            research_question=project.research_question,
            retrieved_knowledge=k_summary,
            successes=successes,
            failures=failures,
            refinement_target=refinement_target,
            iteration=iter_idx
        )
        if not hypo_dicts:
            return _fail(db, project, iter_idx, f"Hypothesis generation produced no valid, executable hypotheses on iteration {iter_idx}. Check LLM connectivity and API keys.")

        db_hypotheses = []
        for hd in hypo_dicts:
            hypo = models.Hypothesis(
                project_id=project_id,
                iteration=iter_idx,
                title=hd.get("title", "Candidate Hypothesis"),
                statement=hd.get("hypothesis", ""),
                reasoning=hd.get("reasoning", ""),
                expected_effect=hd.get("expected_effect", ""),
                plausibility_score=float(hd["plausibility"]),
                novelty_score=float(hd["novelty"]),
                testability_score=float(hd["testability"]),
                consistency_score=float(hd["consistency"]),
                overall_score=float(hd["overall_score"]),
                status="ranked"
            )
            db.add(hypo)
            db.commit()
            db.refresh(hypo)
            db_hypotheses.append((hypo, hd))

        selected_hypo, selected_hd = db_hypotheses[0]
        selected_hypo.status = "selected"
        db.commit()

        if pending_cycle is not None:
            pending_cycle.new_hypothesis_id = selected_hypo.id
            db.commit()
            pending_cycle = None

        spec = selected_hd["experiment_spec"]
        theory_data = theory_service.build_theory(selected_hd, spec)
        theory_obj = models.Theory(
            hypothesis_id=selected_hypo.id,
            theory_title=theory_data["theory_title"],
            theory_description=theory_data["theory_description"],
            mathematical_expression=theory_data["mathematical_expression"],
            algorithm_description=theory_data["algorithm_description"],
            assumptions=theory_data["assumptions"],
            constraints=theory_data["constraints"],
            consistency_status=theory_data["consistency_status"]
        )
        db.add(theory_obj)
        db.commit()
        db.refresh(theory_obj)

        exp_results: Dict[str, Any] = {}
        error_message = ""
        if theory_data["consistency_C"] == 1:
            code = experiment_service.generate_experiment_code(spec, dataset_path)
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

            exp_results, stdout, err = experiment_service.execute_experiment(code)
            exp_obj.completed_at = datetime.utcnow()
            if err:
                exp_obj.status = "failed"
                exp_obj.error_message = err
                error_message = err
            else:
                exp_obj.status = "completed"
                db.add(models.ExperimentResult(
                    experiment_id=exp_obj.id,
                    accuracy=exp_results["accuracy"],
                    precision_score=exp_results["precision_score"],
                    recall_score=exp_results["recall_score"],
                    f1_score=exp_results["f1_score"],
                    baseline_f1=exp_results["baseline_f1"],
                    baseline_accuracy=exp_results["baseline_accuracy"],
                    mae=exp_results["mae"],
                    mse=exp_results["mse"],
                    rmse=exp_results["rmse"],
                    execution_time=exp_results["execution_time"],
                    raw_output=stdout
                ))
            db.commit()
        else:
            error_message = "Theory failed the consistency check C(h)=0 and was not sent to experimentation: " + "; ".join(
                theory_data["constraints"].split("; ")
            )

        val_data, decision, explanation = validation_service.validate_theory_candidate(
            theory_data["consistency_C"], selected_hd, exp_results, error_message
        )
        db.add(models.Validation(
            theory_id=theory_obj.id,
            consistency_score=val_data["consistency_score"],
            agreement_score=val_data["agreement_score"],
            novelty_score=val_data["novelty_score"],
            reproducibility_score=val_data["reproducibility_score"],
            validation_score=val_data["validation_score"],
            decision=decision,
            explanation=explanation
        ))
        db.commit()

        prop_f1 = float(exp_results.get("f1_score") or 0.0)
        base_f1 = float(exp_results.get("baseline_f1") or 0.0)
        title = selected_hypo.title

        if decision == "validated":
            selected_hypo.status = "validated"
            db.commit()
            memory_service.record_memory(
                db, project_id, iter_idx, "successful_candidate",
                f"Validated hypothesis '{title}' with F1={prop_f1:.3f} vs baseline F1={base_f1:.3f}. {explanation}"
            )
            validated_candidate = {"hypothesis": selected_hypo.id, "theory": theory_obj.id}
            break

        if decision == "refine":
            selected_hypo.status = "refined"
            db.commit()
            memory_service.record_memory(
                db, project_id, iter_idx, "failed_hypothesis",
                f"Iteration {iter_idx} hypothesis '{title}' needs refinement: {explanation}"
            )
            pending_cycle = models.RefinementCycle(
                project_id=project_id,
                previous_hypothesis_id=selected_hypo.id,
                reason=explanation,
                evidence=json.dumps({
                    "spec": spec,
                    "f1_score": exp_results.get("f1_score"),
                    "baseline_f1": exp_results.get("baseline_f1"),
                    "f1_stability": exp_results.get("f1_stability")
                }),
                iteration=iter_idx
            )
            db.add(pending_cycle)
            db.commit()
            refinement_target = {
                "title": title,
                "hypothesis": selected_hd.get("hypothesis", ""),
                "experiment_spec": spec,
                "evaluation": explanation
            }
        else:
            selected_hypo.status = "rejected"
            db.commit()
            memory_service.record_memory(
                db, project_id, iter_idx, "failed_hypothesis",
                f"Iteration {iter_idx} hypothesis '{title}' was rejected: {explanation}"
            )
            refinement_target = None

    project.status = "completed"
    db.commit()
    return {
        "project_id": project_id,
        "status": "completed",
        "iterations_completed": project.current_iteration,
        "validated_candidate": validated_candidate is not None
    }

def run_discovery_in_background(project_id: int):
    from app.database.database import SessionLocal
    db = SessionLocal()
    try:
        run_closed_loop_discovery(project_id, db)
    except Exception as e:
        project = db.query(models.ResearchProject).filter(models.ResearchProject.id == project_id).first()
        if project:
            _fail(db, project, project.current_iteration or 0, f"Discovery crashed: {e}")
    finally:
        db.close()
