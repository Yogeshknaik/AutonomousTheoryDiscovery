from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import models, database

router = APIRouter(prefix="/api/benchmarks", tags=["benchmarks"])


@router.get("/summary")
def benchmark_summary(project_id: Optional[int] = None, db: Session = Depends(database.get_db)):
    """Measured results aggregated from stored hypotheses and validations (all projects, or one project)."""
    hq = db.query(models.Hypothesis)
    vq = db.query(models.Validation).join(models.Theory, models.Validation.theory_id == models.Theory.id) \
        .join(models.Hypothesis, models.Theory.hypothesis_id == models.Hypothesis.id)
    if project_id is not None:
        hq = hq.filter(models.Hypothesis.project_id == project_id)
        vq = vq.filter(models.Hypothesis.project_id == project_id)
    hyps = hq.all()
    vals = vq.all()

    def avg(xs):
        xs = [x for x in xs if x is not None]
        return round(sum(xs) / len(xs) * 100, 1) if xs else None

    counts = {"validated": 0, "refine": 0, "reject": 0}
    for v in vals:
        counts[v.decision if v.decision in counts else "reject"] += 1
    total = len(vals)

    def share(n):
        return round(n / total * 100, 1) if total else 0

    return {
        "hypotheses": len(hyps),
        "validations": total,
        "criteria": [
            {"key": "hypothesis_quality", "label": "Hypothesis Quality", "value": avg([h.overall_score for h in hyps]), "color": "bg-purple-600"},
            {"key": "theory_consistency", "label": "Theory Consistency", "value": avg([v.consistency_score for v in vals]), "color": "bg-emerald-600"},
            {"key": "prediction_agreement", "label": "Prediction Agreement", "value": avg([v.agreement_score for v in vals]), "color": "bg-indigo-600"},
            {"key": "novelty", "label": "Novelty", "value": avg([v.novelty_score for v in vals]), "color": "bg-amber-600"},
            {"key": "reproducibility", "label": "Reproducibility", "value": avg([v.reproducibility_score for v in vals]), "color": "bg-cyan-600"},
        ],
        "decisions": {k: {"count": counts[k], "pct": share(counts[k])} for k in ("validated", "refine", "reject")},
    }
