from typing import Dict, Any, Tuple

def validate_theory_candidate(
    consistency_C: int,
    hypothesis: Dict[str, Any],
    results: Dict[str, Any],
    error_message: str = "",
    weights: Dict[str, float] = None
) -> Tuple[Dict[str, Any], str, str]:
    """
    Composite validation score from PDF Eq. 6: V(h) = alpha*C(h) + beta*A(h) + gamma*N(h) + delta*R(h).
    C(h): consistency check result (0 or 1). A(h): measured F1 improvement over baseline.
    N(h): novelty as proposed by the hypothesis generator. R(h): measured F1 stability across seeds.
    """
    if error_message or not results:
        explanation = error_message or "No experiment results were produced"
        zero = {
            "consistency_score": 0.0, "agreement_score": 0.0, "novelty_score": 0.0,
            "reproducibility_score": 0.0, "validation_score": 0.0,
            "decision": "reject", "explanation": explanation
        }
        return zero, "reject", explanation

    consistency_score = 1.0 if consistency_C == 1 else 0.0

    f1 = float(results.get("f1_score") or 0.0)
    base_f1 = float(results.get("baseline_f1") or 0.0)
    improvement_pct = (f1 - base_f1) / base_f1 if base_f1 > 0 else 0.0

    if improvement_pct >= 0.03:
        agreement_score = 0.95
    elif improvement_pct > 0.0:
        agreement_score = 0.75
    elif improvement_pct > -0.02:
        agreement_score = 0.50
    else:
        agreement_score = 0.20

    novelty_score = float(hypothesis.get("novelty", 0.0))
    reproducibility_score = float(results.get("f1_stability") or 0.0)

    w = weights or {"alpha": 0.30, "beta": 0.30, "gamma": 0.20, "delta": 0.20}
    alpha, beta, gamma, delta = (float(w["alpha"]), float(w["beta"]), float(w["gamma"]), float(w["delta"]))
    total_w = alpha + beta + gamma + delta
    alpha, beta, gamma, delta = alpha / total_w, beta / total_w, gamma / total_w, delta / total_w

    val_score = round((alpha * consistency_score + beta * agreement_score + gamma * novelty_score + delta * reproducibility_score) * 100, 2)

    if consistency_score < 0.5 or agreement_score < 0.3:
        decision = "reject"
        explanation = f"Hypothesis rejected due to performance degradation or inconsistency (Baseline F1: {base_f1:.3f}, Proposed F1: {f1:.3f}, Change: {improvement_pct*100:+.2f}%)."
    elif val_score >= 75.0 and improvement_pct >= 0.01:
        decision = "validated"
        explanation = f"Validated Candidate! Theory demonstrated an empirical +{improvement_pct*100:.2f}% improvement in F1 score (Baseline: {base_f1:.3f} -> Proposed: {f1:.3f}) with consistent formal expression and stability {reproducibility_score:.2f} across seeds."
    else:
        decision = "refine"
        explanation = f"Candidate requires refinement (Validation Score: {val_score}/100, F1 change: {improvement_pct*100:+.2f}%, stability: {reproducibility_score:.2f})."

    validation_data = {
        "consistency_score": round(consistency_score, 2),
        "agreement_score": round(agreement_score, 2),
        "novelty_score": round(novelty_score, 2),
        "reproducibility_score": round(reproducibility_score, 2),
        "validation_score": val_score,
        "decision": decision,
        "explanation": explanation,
    }
    return validation_data, decision, explanation
