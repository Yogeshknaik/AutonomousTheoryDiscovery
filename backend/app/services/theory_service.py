import json
import re
import sympy as sp
from sympy.parsing.sympy_parser import parse_expr
from typing import Dict, Any

def to_str(val: Any) -> str:
    if val is None:
        return ""
    if isinstance(val, list):
        return "\n".join(str(item) for item in val)
    if isinstance(val, dict):
        return json.dumps(val)
    return str(val)

def check_consistency(expression: str) -> Dict[str, Any]:
    """C(h) from PDF Eq. 4: 1 if the formal expression parses as a symbolic relation over at least one variable, else 0."""
    issues = []
    if not expression or not expression.strip():
        return {"C": 0, "status": "FAIL", "issues": ["No mathematical expression provided"]}
    rhs = (expression.split("=", 1)[1] if "=" in expression else expression).strip()
    local_dict = {}
    for name in set(re.findall(r"[A-Za-z_]\w*", rhs)):
        is_applied = re.search(rf"(?<![\w.]){re.escape(name)}\s*\(", rhs) is not None
        local_dict[name] = sp.Function(name) if is_applied else sp.Symbol(name)
    try:
        parsed = parse_expr(rhs, local_dict=local_dict, evaluate=False)
    except Exception as e:
        return {"C": 0, "status": "FAIL", "issues": [f"Expression does not parse: {e}"]}
    if not getattr(parsed, "free_symbols", None):
        return {"C": 0, "status": "FAIL", "issues": ["Expression contains no variables"]}
    return {"C": 1, "status": "PASS", "issues": issues}

def build_theory(hypothesis: Dict[str, Any], experiment_spec: Dict[str, Any]) -> Dict[str, Any]:
    expression = to_str(hypothesis.get("theory_expression", ""))
    check = check_consistency(expression)
    return {
        "theory_title": to_str(hypothesis.get("title", "")),
        "theory_description": to_str(hypothesis.get("hypothesis", "")),
        "mathematical_expression": expression,
        "algorithm_description": json.dumps(experiment_spec, indent=2),
        "assumptions": to_str(hypothesis.get("reasoning", "")),
        "constraints": "; ".join(check["issues"]) if check["issues"] else "Expression parses and contains variables",
        "consistency_status": check["status"],
        "consistency_C": check["C"],
    }
