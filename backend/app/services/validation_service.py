from typing import Dict, Any, Tuple

def validate_theory_candidate(
    theory: Dict[str, Any],
    hypothesis: Dict[str, Any],
    results: Dict[str, Any],
    error_message: str = ""
) -> Tuple[Dict[str, Any], str, str]:
    """
    Calculates composite validation score based on PRD Section 29:
    V(h) = alpha * C(h) + beta * A(h) + gamma * N(h) + delta * R(h)
    alpha = 0.25 (Consistency)
    beta = 0.35 (Agreement with evidence / Improvement)
    gamma = 0.20 (Novelty)
    delta = 0.20 (Reproducibility)
    """
    if error_message or not results:
        validation_data = {
            "consistency_score": 0.0,
            "agreement_score": 0.0,
            "novelty_score": 0.0,
            "reproducibility_score": 0.0,
            "validation_score": 0.0,
            "decision": "reject",
            "explanation": f"Experiment execution failed: {error_message}"
        }
        return validation_data, "reject", validation_data["explanation"]

    # 1. Consistency Score (0.0 to 1.0)
    consistency_status = theory.get("consistency_status", "PASS")
    consistency_score = 1.0 if consistency_status == "PASS" else (0.6 if consistency_status == "WARNING" else 0.0)

    # 2. Agreement Score (Experimental improvement over baseline)
    f1 = results.get("f1_score", 0.0)
    base_f1 = results.get("baseline_f1", 0.0)
    
    if base_f1 > 0:
        improvement_pct = (f1 - base_f1) / base_f1
    else:
        improvement_pct = 0.0

    if improvement_pct >= 0.03: # >= 3% improvement
        agreement_score = 0.95
    elif improvement_pct > 0.0: # marginal improvement
        agreement_score = 0.75
    elif improvement_pct > -0.02: # neutral/minimal drop
        agreement_score = 0.50
    else: # performance degraded
        agreement_score = 0.20

    # 3. Novelty Score
    novelty_score = float(hypothesis.get("novelty_score", hypothesis.get("novelty", 0.75)))

    # 4. Reproducibility Score (Deterministic seed execution & complete metrics)
    reproducibility_score = 0.90 if results.get("execution_time", 0) > 0 else 0.50

    # Weighted validation score formula
    alpha, beta, gamma, delta = 0.25, 0.35, 0.20, 0.20
    val_score = (alpha * consistency_score) + (beta * agreement_score) + (gamma * novelty_score) + (delta * reproducibility_score)
    val_score = round(val_score * 100, 2)

    # Candidate Decision Engine (PRD Section 30)
    if consistency_score < 0.5 or agreement_score < 0.3:
        decision = "reject"
        explanation = f"Hypothesis rejected due to performance degradation or inconsistency (Baseline F1: {base_f1:.3f}, Proposed F1: {f1:.3f}, Change: {improvement_pct*100:+.2f}%)."
    elif val_score >= 80.0 and improvement_pct >= 0.02:
        decision = "validated"
        explanation = f"Validated Candidate! Theory demonstrated a solid +{improvement_pct*100:.2f}% improvement in F1 score (Baseline: {base_f1:.3f} -> Proposed: {f1:.3f}) with high scientific consistency."
    else:
        decision = "refine"
        explanation = f"Candidate shows promise (F1: {f1:.3f}, Baseline: {base_f1:.3f}), but requires further refinement of feature cutoff parameters and ensembling techniques."

    validation_data = {
        "consistency_score": round(consistency_score * 100, 1),
        "agreement_score": round(agreement_score * 100, 1),
        "novelty_score": round(novelty_score * 100, 1),
        "reproducibility_score": round(reproducibility_score * 100, 1),
        "validation_score": val_score,
        "decision": decision,
        "explanation": explanation
    }

    return validation_data, decision, explanation
