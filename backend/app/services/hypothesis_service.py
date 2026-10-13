import json
from typing import List, Dict, Any, Optional
from app.services.llm_service import call_llm
from app.services.experiment_service import validate_spec

def parse_json_array(text: str) -> List[Dict[str, Any]]:
    if not text:
        return []
    cleaned = text.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    cleaned = cleaned.strip()
    try:
        data = json.loads(cleaned)
        if isinstance(data, list):
            return data
    except Exception:
        pass
    start = cleaned.find('[')
    end = cleaned.rfind(']')
    if start != -1 and end != -1 and end > start:
        try:
            data = json.loads(cleaned[start:end+1])
            if isinstance(data, list):
                return data
        except Exception:
            pass
    return []

SPEC_SCHEMA = """"experiment_spec": {
      "model": "random_forest | gradient_boosting | logistic_regression",
      "feature_selection": "none | mutual_info | random_forest | correlation | hybrid",
      "top_fraction": 0.6,
      "normalize": false,
      "n_estimators": 100,
      "max_depth": null,
      "learning_rate": 0.1,
      "C": 1.0
    }"""

def _build_prompt(problem_title, research_question, retrieved_knowledge, successes, failures, refinement_target, iteration):
    refinement_block = ""
    if refinement_target:
        refinement_block = f"""
Refinement target from the previous iteration (this candidate was marginal; propose a refined version that changes the experiment spec):
{json.dumps(refinement_target, indent=2)}
"""
    return f"""
Research Problem: {problem_title}
Research Question: {research_question}
Retrieved Knowledge Context: {retrieved_knowledge}
Previously validated candidates to build on: {json.dumps(successes)}
Previous failures and negative results to avoid: {json.dumps(failures)}
{refinement_block}
Current Discovery Iteration: {iteration}

Generate 4 distinct, testable hypotheses for this problem. Each hypothesis must be executable: include an experiment_spec that a fixed experiment runner will train and evaluate on the user's tabular dataset.
Return ONLY a valid JSON array of objects with this schema:
[
  {{
    "title": "Concise descriptive title",
    "hypothesis": "Formal hypothesis statement",
    "reasoning": "Scientific grounding for the mechanism",
    "expected_effect": "Expected change in the evaluation metric",
    "plausibility": 0.85,
    "novelty": 0.75,
    "testability": 0.90,
    "consistency": 0.88,
    "theory_expression": "Pure mathematical expression only, e.g. S(x) = alpha * f1(x) + (1-alpha) * f2(x). No prose, units, or 'where' clauses; put parameter values in experiment_spec",
    {SPEC_SCHEMA}
  }}
]
All score values MUST be numbers between 0.0 and 1.0.
"""

def generate_and_rank_hypotheses(
    problem_title: str,
    research_question: str,
    retrieved_knowledge: str,
    successes: List[str],
    failures: List[str],
    refinement_target: Optional[Dict[str, Any]],
    iteration: int = 1
) -> List[Dict[str, Any]]:
    """
    Generate hypotheses with executable experiment specs and rank them with
    Score(h) = 0.30 * Plausibility + 0.20 * Novelty + 0.25 * Testability + 0.25 * Consistency.
    Hypotheses whose experiment_spec fails validation are dropped.
    """
    system_prompt = "You are an autonomous AI research scientist. Return ONLY a valid JSON array."
    prompt = _build_prompt(problem_title, research_question, retrieved_knowledge, successes, failures, refinement_target, iteration)

    hypotheses = parse_json_array(call_llm(prompt, system_prompt))
    if not hypotheses:
        return []

    valid = []
    for h in hypotheses:
        try:
            h["experiment_spec"] = validate_spec(h.get("experiment_spec"))
        except ValueError as e:
            print(f"Dropping hypothesis '{h.get('title')}': {e}")
            continue
        try:
            p = float(h.get("plausibility", 0.0))
            n = float(h.get("novelty", 0.0))
            t = float(h.get("testability", 0.0))
            c = float(h.get("consistency", 0.0))
        except (ValueError, TypeError):
            continue
        h["overall_score"] = round((0.30 * p) + (0.20 * n) + (0.25 * t) + (0.25 * c), 3)
        valid.append(h)

    valid.sort(key=lambda x: x["overall_score"], reverse=True)
    return valid
