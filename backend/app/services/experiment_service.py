import os
import sys
import json
import subprocess
import tempfile
from typing import Dict, Any, Tuple

ALLOWED_MODELS = {"random_forest", "gradient_boosting", "logistic_regression"}
ALLOWED_SELECTION = {"none", "mutual_info", "random_forest", "correlation", "hybrid"}

def validate_spec(spec: Any) -> Dict[str, Any]:
    if not isinstance(spec, dict):
        raise ValueError("experiment_spec must be a JSON object")
    model = spec.get("model")
    if model not in ALLOWED_MODELS:
        raise ValueError(f"experiment_spec.model must be one of {sorted(ALLOWED_MODELS)}")
    selection = spec.get("feature_selection", "none")
    if selection not in ALLOWED_SELECTION:
        raise ValueError(f"experiment_spec.feature_selection must be one of {sorted(ALLOWED_SELECTION)}")
    try:
        top_fraction = float(spec.get("top_fraction", 1.0))
        n_estimators = int(spec.get("n_estimators", 100))
        max_depth = spec.get("max_depth")
        max_depth = None if max_depth in (None, "", 0) else int(max_depth)
        learning_rate = float(spec.get("learning_rate", 0.1))
        C = float(spec.get("C", 1.0))
    except (TypeError, ValueError) as e:
        raise ValueError(f"experiment_spec has a non-numeric parameter: {e}")
    if not (0.0 < top_fraction <= 1.0):
        raise ValueError("experiment_spec.top_fraction must be in (0, 1]")
    if not (1 <= n_estimators <= 500):
        raise ValueError("experiment_spec.n_estimators must be between 1 and 500")
    if max_depth is not None and not (1 <= max_depth <= 30):
        raise ValueError("experiment_spec.max_depth must be between 1 and 30")
    if not (0.0 < learning_rate <= 1.0):
        raise ValueError("experiment_spec.learning_rate must be in (0, 1]")
    if not (0.0 < C <= 1000.0):
        raise ValueError("experiment_spec.C must be in (0, 1000]")
    return {
        "model": model,
        "feature_selection": selection,
        "top_fraction": top_fraction,
        "normalize": bool(spec.get("normalize", False)),
        "n_estimators": n_estimators,
        "max_depth": max_depth,
        "learning_rate": learning_rate,
        "C": C,
    }

EXPERIMENT_TEMPLATE = r'''import sys
import json
import time
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.feature_selection import mutual_info_classif
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, mean_absolute_error, mean_squared_error

DATASET_PATH = __DATASET_PATH__
SPEC = json.loads(__SPEC_JSON__)
SEEDS = [42, 43, 44]

def build_model(name, spec, seed):
    if name == "random_forest":
        return RandomForestClassifier(n_estimators=spec["n_estimators"], max_depth=spec["max_depth"], random_state=seed)
    if name == "gradient_boosting":
        return GradientBoostingClassifier(n_estimators=spec["n_estimators"], max_depth=spec["max_depth"] or 3, learning_rate=spec["learning_rate"], random_state=seed)
    return LogisticRegression(C=spec["C"], max_iter=2000, random_state=seed)

def min_max_normalize(X_train, X_test):
    lo = X_train.min()
    rng = X_train.max() - lo
    rng = rng.where(rng > 0, 1.0)
    return (X_train - lo) / rng, (X_test - lo) / rng

def select_features(X_train, y_train, spec, seed):
    n = X_train.shape[1]
    method = spec["feature_selection"]
    k = max(1, int(round(spec["top_fraction"] * n)))
    if method == "none" or k >= n:
        return list(range(n))
    mi = None
    rf = None
    if method in ("mutual_info", "hybrid"):
        mi = mutual_info_classif(X_train, y_train, random_state=seed)
    if method in ("random_forest", "hybrid"):
        rf_model = RandomForestClassifier(n_estimators=100, random_state=seed).fit(X_train, y_train)
        rf = rf_model.feature_importances_
    if method == "mutual_info":
        scores = mi
    elif method == "random_forest":
        scores = rf
    elif method == "correlation":
        scores = np.nan_to_num(np.abs(X_train.corrwith(y_train).values))
    else:
        def norm(v):
            r = v.max() - v.min()
            return (v - v.min()) / (r if r > 0 else 1.0)
        scores = 0.5 * norm(mi) + 0.5 * norm(rf)
    return list(np.argsort(scores)[::-1][:k])

def metrics(y_true, y_pred):
    return {
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "precision": float(precision_score(y_true, y_pred, average="weighted", zero_division=0)),
        "recall": float(recall_score(y_true, y_pred, average="weighted", zero_division=0)),
        "f1": float(f1_score(y_true, y_pred, average="weighted", zero_division=0)),
        "mae": float(mean_absolute_error(y_true, y_pred)),
        "mse": float(mean_squared_error(y_true, y_pred)),
    }

def run():
    start = time.time()
    spec = SPEC
    df = pd.read_csv(DATASET_PATH)
    for col in df.select_dtypes(include=["object"]).columns:
        df[col] = df[col].astype("category").cat.codes
    df = df.fillna(df.mean(numeric_only=True))

    target_col = df.columns[-1]
    for possible in ["target", "class", "label", "outcome", "output"]:
        matches = [c for c in df.columns if c.lower() == possible]
        if matches:
            target_col = matches[0]
            break

    X = df.drop(columns=[target_col])
    y = df[target_col]
    if X.shape[1] == 0:
        raise ValueError("Dataset has no feature columns besides the target")

    base_runs = []
    prop_runs = []
    prop_predictions_seed = None
    for seed in SEEDS:
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=seed)

        baseline = build_model("random_forest", {"n_estimators": 100, "max_depth": None}, seed)
        baseline.fit(X_train, y_train)
        base_runs.append(metrics(y_test, baseline.predict(X_test)))

        Xtr, Xte = X_train, X_test
        if spec["normalize"]:
            Xtr, Xte = min_max_normalize(X_train, X_test)
        cols = select_features(Xtr, y_train, spec, seed)
        model = build_model(spec["model"], spec, seed)
        model.fit(Xtr.iloc[:, cols], y_train)
        preds = model.predict(Xte.iloc[:, cols])
        prop_runs.append(metrics(y_test, preds))
        if seed == SEEDS[0]:
            prop_predictions_seed = preds

    def mean(runs, key):
        return float(np.mean([r[key] for r in runs]))

    prop_f1 = [r["f1"] for r in prop_runs]
    prop_f1_mean = float(np.mean(prop_f1))
    prop_f1_std = float(np.std(prop_f1))
    stability = 1.0 - min(1.0, prop_f1_std / prop_f1_mean) if prop_f1_mean > 0 else 0.0

    k_selected = len(cols)
    output = {
        "baseline_accuracy": mean(base_runs, "accuracy"),
        "baseline_f1": mean(base_runs, "f1"),
        "accuracy": mean(prop_runs, "accuracy"),
        "precision_score": mean(prop_runs, "precision"),
        "recall_score": mean(prop_runs, "recall"),
        "f1_score": prop_f1_mean,
        "f1_std": prop_f1_std,
        "f1_stability": stability,
        "mae": mean(prop_runs, "mae"),
        "mse": mean(prop_runs, "mse"),
        "rmse": float(np.sqrt(mean(prop_runs, "mse"))),
        "per_seed_f1": prop_f1,
        "per_seed_baseline_f1": [r["f1"] for r in base_runs],
        "seeds": SEEDS,
        "selected_features_count": int(k_selected),
        "total_features_count": int(X.shape[1]),
        "execution_time": round(time.time() - start, 4),
        "spec": spec,
    }
    print(json.dumps(output))

if __name__ == "__main__":
    run()
'''

def generate_experiment_code(spec: Dict[str, Any], dataset_path: str) -> str:
    return (EXPERIMENT_TEMPLATE
            .replace("__DATASET_PATH__", repr(os.path.abspath(dataset_path)))
            .replace("__SPEC_JSON__", repr(json.dumps(spec))))

def execute_experiment(code: str, timeout_seconds: int = 300) -> Tuple[Dict[str, Any], str, str]:
    with tempfile.TemporaryDirectory() as tmp:
        script_path = os.path.join(tmp, "experiment.py")
        with open(script_path, "w", encoding="utf-8") as f:
            f.write(code)

        env = os.environ.copy()
        env["PYTHONIOENCODING"] = "utf-8"
        env["OPENBLAS_NUM_THREADS"] = "1"
        env["OMP_NUM_THREADS"] = "1"
        try:
            proc = subprocess.run(
                [sys.executable, script_path],
                capture_output=True, text=True, timeout=timeout_seconds, env=env, cwd=tmp
            )
        except subprocess.TimeoutExpired:
            return {}, "", f"Experiment exceeded {timeout_seconds}s timeout"

    stdout = proc.stdout.strip()
    if proc.returncode != 0:
        tail = proc.stderr.strip().splitlines()[-5:]
        return {}, stdout, "Experiment failed: " + " | ".join(tail)
    lines = [line for line in stdout.split("\n") if line.strip()]
    try:
        return json.loads(lines[-1]), stdout, ""
    except (IndexError, json.JSONDecodeError):
        return {}, stdout, "Experiment produced no JSON metrics"
