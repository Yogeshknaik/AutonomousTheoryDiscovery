from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import models, database

router = APIRouter(prefix="/api/projects/{project_id}/reports", tags=["reports"])

@router.get("")
def generate_discovery_report(project_id: int, db: Session = Depends(database.get_db)):
    proj = db.query(models.ResearchProject).filter(models.ResearchProject.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    hypotheses = db.query(models.Hypothesis).filter(models.Hypothesis.project_id == project_id).all()
    experiments = db.query(models.Experiment).filter(models.Experiment.project_id == project_id).all()
    memories = db.query(models.DiscoveryMemory).filter(models.DiscoveryMemory.project_id == project_id).all()
    
    validated_hypo = next((h for h in hypotheses if h.status == "validated"), None)
    best_theory = None
    best_result = None
    best_val = None

    if validated_hypo and validated_hypo.theories:
        best_theory = validated_hypo.theories[0]
        if best_theory.experiments and best_theory.experiments[0].results:
            best_result = best_theory.experiments[0].results[0]
        if best_theory.validations:
            best_val = best_theory.validations[0]

    # Calculate real improvement if metrics exist
    improvement_str = "N/A"
    if best_result and best_result.baseline_f1 and best_result.f1_score is not None:
        if best_result.baseline_f1 > 0:
            diff = (best_result.f1_score - best_result.baseline_f1) / best_result.baseline_f1 * 100.0
            improvement_str = f"+{diff:.2f}%" if diff >= 0 else f"{diff:.2f}%"

    validated_candidate_data = None
    if validated_hypo:
        validated_candidate_data = {
            "title": validated_hypo.title,
            "statement": validated_hypo.statement,
            "overall_score": validated_hypo.overall_score,
            "theory_title": best_theory.theory_title if best_theory else "Theory Candidate",
            "mathematical_expression": best_theory.mathematical_expression if best_theory else "N/A",
            "baseline_f1": best_result.baseline_f1 if best_result else None,
            "proposed_f1": best_result.f1_score if best_result else None,
            "improvement": improvement_str,
            "validation_score": best_val.validation_score if best_val else None,
            "decision": best_val.decision if best_val else "VALIDATED"
        }

    report = {
        "title": f"AUTONOMOUS THEORY DISCOVERY REPORT: {proj.title}",
        "project_id": proj.id,
        "research_question": proj.research_question,
        "objective": proj.objective or "Improve model accuracy and scientific rigor",
        "domain": proj.domain,
        "total_iterations": proj.current_iteration,
        "total_hypotheses_generated": len(hypotheses),
        "total_experiments_run": len(experiments),
        "validated_candidate": validated_candidate_data,
        "discovery_history": [
            {
                "iteration": m.iteration,
                "memory_type": m.memory_type,
                "content": m.content,
                "created_at": m.created_at.strftime("%Y-%m-%d %H:%M:%S")
            } for m in memories
        ],
        "conclusion": (
            "The autonomous discovery pipeline has completed iterations for this project. "
            + ("A theory candidate has been successfully verified and validated against empirical baselines."
               if validated_candidate_data else
               "Pipeline has not yet produced a validated candidate or is awaiting execution.")
        )
    }
    return report
