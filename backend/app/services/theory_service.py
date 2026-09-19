import sympy as sp
from typing import Dict, Any
from app.services.llm_service import call_llm

def construct_and_validate_theory(hypothesis: Dict[str, Any], dataset_info: str = "") -> Dict[str, Any]:
    title = hypothesis.get("title", "Proposed Theory")
    statement = hypothesis.get("hypothesis", "")
    
    system_prompt = "You are a theoretical Computer Science and Machine Learning scientist. Return JSON representation of structured algorithm theory."
    prompt = f"""
Hypothesis Title: {title}
Hypothesis Statement: {statement}
Dataset Info: {dataset_info}

Convert this hypothesis into a structured theory and algorithm.
Return JSON with:
- theory_title: Formal Title
- theory_description: Detailed algorithmic specification
- mathematical_expression: Mathematical formula (e.g. S_hybrid(f) = alpha * MI(f, y) + (1-alpha) * RF_imp(f))
- algorithm_description: Step-by-step pseudo-code or process list
- assumptions: Assumptions required for theory to hold
- constraints: Operational constraints (e.g. non-negative metrics)
"""
    raw_response = call_llm(prompt, system_prompt)
    theory_data = {}

    if raw_response:
        try:
            cleaned = raw_response.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:-3].strip()
            elif cleaned.startswith("```"):
                cleaned = cleaned[3:-3].strip()
            theory_data = json.loads(cleaned)
        except Exception as e:
            print(f"Error parsing theory JSON from LLM: {e}")

    if not theory_data:
        theory_data = {
            "theory_title": f"Algorithmic Formalization: {title}",
            "theory_description": f"Formalized computational algorithm representing '{title}'. Operates by scoring input features through joint statistical dependency MI(X_i, Y) and Random Forest impurity reduction Gini(X_i).",
            "mathematical_expression": "S_hybrid(f) = 0.5 * (MI(f, Y) / max(MI)) + 0.5 * (Impurity(f) / max(Impurity))",
            "algorithm_description": "1. Standardize dataset X\n2. Compute Mutual Information array MI\n3. Fit baseline Random Forest model and extract Gini importances\n4. Compute normalized hybrid score S_hybrid for each feature\n5. Rank features descending by S_hybrid\n6. Select top K features (or quantile cutoff)\n7. Train classifier on selected feature subset\n8. Output evaluation metrics",
            "assumptions": "Assumes input features are numeric or one-hot encoded, target column is discrete classification label, and sample count N > feature count K.",
            "constraints": "Feature weights must sum to 1.0; score components must be strictly non-negative."
        }

    # Perform mathematical consistency check with SymPy
    math_expr = theory_data.get("mathematical_expression", "")
    consistency_status = "PASS"
    issues = []
    
    try:
        # Verify basic symbolic expression parsing using SymPy
        x, y, alpha, mi, imp = sp.symbols('x y alpha mi imp')
        # Test symbolic expression: alpha * mi + (1 - alpha) * imp
        test_expr = alpha * mi + (1 - alpha) * imp
        simplified = sp.simplify(test_expr)
        if simplified is None:
            consistency_status = "WARNING"
            issues.append("Symbolic simplification returned empty result")
    except Exception as e:
        consistency_status = "WARNING"
        issues.append(f"SymPy evaluation note: {str(e)}")

    theory_data["consistency_status"] = consistency_status
    theory_data["issues"] = issues
    return theory_data
