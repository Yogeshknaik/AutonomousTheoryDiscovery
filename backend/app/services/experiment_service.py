import os
import sys
import json
import time
import subprocess
import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple

def generate_experiment_code(theory: Dict[str, Any], dataset_path: str) -> str:
    """Generate Python experiment code for baseline vs proposed theory execution."""
    title = theory.get("theory_title", "Proposed Algorithm")
    
    code = f'''import sys
import json
import time
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_selection import mutual_info_classif
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, mean_squared_error

def run():
    start_time = time.time()
    dataset_path = r"{dataset_path}"
    
    # Load dataset
    df = pd.read_csv(dataset_path)
    
    # Handle numeric encoding and missing values
    for col in df.select_dtypes(include=['object']).columns:
        df[col] = df[col].astype('category').cat.codes
    df = df.fillna(df.mean(numeric_only=True))
    
    # Separate target (last column or 'target'/'class')
    target_col = df.columns[-1]
    for possible in ['target', 'class', 'label', 'outcome', 'output']:
        if possible in [c.lower() for c in df.columns]:
            for c in df.columns:
                if c.lower() == possible:
                    target_col = c
                    break
    
    X = df.drop(columns=[target_col])
    y = df[target_col]
    
    # Split train/test
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)
    
    # 1. Baseline Model Execution (Using All Features)
    baseline_model = RandomForestClassifier(n_estimators=100, random_state=42)
    baseline_model.fit(X_train, y_train)
    b_preds = baseline_model.predict(X_test)
    
    baseline_acc = float(accuracy_score(y_test, b_preds))
    baseline_f1 = float(f1_score(y_test, b_preds, average='weighted', zero_division=0))
    
    # 2. Proposed Theory Execution (Hybrid Feature Selection)
    # Compute Mutual Information
    mi_scores = mutual_info_classif(X_train, y_train, random_state=42)
    mi_norm = (mi_scores - mi_scores.min()) / (mi_scores.max() - mi_scores.min() + 1e-8)
    
    # Compute Random Forest Gini Importances
    rf_imps = baseline_model.feature_importances_
    rf_norm = (rf_imps - rf_imps.min()) / (rf_imps.max() - rf_imps.min() + 1e-8)
    
    # Hybrid Score Calculation
    hybrid_scores = 0.5 * mi_norm + 0.5 * rf_norm
    
    # Select top 60% of features based on hybrid score
    k = max(1, int(len(X.columns) * 0.6))
    top_indices = np.argsort(hybrid_scores)[::-1][:k]
    
    X_train_sub = X_train.iloc[:, top_indices]
    X_test_sub = X_test.iloc[:, top_indices]
    
    # Fit Proposed Classifier on Refined Feature Set
    proposed_model = RandomForestClassifier(n_estimators=100, random_state=42)
    proposed_model.fit(X_train_sub, y_train)
    p_preds = proposed_model.predict(X_test_sub)
    
    prop_acc = float(accuracy_score(y_test, p_preds))
    prop_prec = float(precision_score(y_test, p_preds, average='weighted', zero_division=0))
    prop_rec = float(recall_score(y_test, p_preds, average='weighted', zero_division=0))
    prop_f1 = float(f1_score(y_test, p_preds, average='weighted', zero_division=0))
    
    mse = float(mean_squared_error(y_test, p_preds))
    rmse = float(np.sqrt(mse))
    
    exec_time = time.time() - start_time
    
    output = {{
        "baseline_accuracy": baseline_acc,
        "baseline_f1": baseline_f1,
        "accuracy": prop_acc,
        "precision_score": prop_prec,
        "recall_score": prop_rec,
        "f1_score": prop_f1,
        "mse": mse,
        "rmse": rmse,
        "execution_time": round(exec_time, 4),
        "selected_features_count": int(k),
        "total_features_count": int(len(X.columns))
    }}
    
    print(json.dumps(output))

if __name__ == "__main__":
    run()
'''
    return code

def execute_experiment_code(code: str, timeout_seconds: int = 30) -> Tuple[Dict[str, Any], str, str]:
    """Execute Python code in an isolated subprocess with timeout protection."""
    temp_script = os.path.join(os.getcwd(), "temp_experiment_runner.py")
    with open(temp_script, "w", encoding="utf-8") as f:
        f.write(code)
        
    try:
        proc = subprocess.run(
            [sys.executable, temp_script],
            capture_output=True,
            text=True,
            timeout=timeout_seconds
        )
        stdout = proc.stdout.strip()
        stderr = proc.stderr.strip()
        
        if os.path.exists(temp_script):
            os.remove(temp_script)
            
        if proc.returncode != 0:
            return {}, stdout, f"Process failed with return code {proc.returncode}:\n{stderr}"
            
        # Parse JSON output from last line of stdout
        lines = [line for line in stdout.split("\n") if line.strip()]
        if lines:
            try:
                results = json.loads(lines[-1])
                return results, stdout, ""
            except Exception as e:
                return {}, stdout, f"Error parsing output JSON: {e}"
                
        return {}, stdout, "No output produced by experiment execution script"
        
    except subprocess.TimeoutExpired:
        if os.path.exists(temp_script):
            os.remove(temp_script)
        return {}, "", f"Experiment execution timed out after {timeout_seconds} seconds"
    except Exception as e:
        if os.path.exists(temp_script):
            os.remove(temp_script)
        return {}, "", f"Execution error: {str(e)}"
