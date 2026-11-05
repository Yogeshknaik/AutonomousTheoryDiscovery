# Sample Scenarios: Copy, Paste, Run

This folder has **7 ready-made research scenarios**. Each one has:

- `dataset.csv`: the data the system trains and tests models on (required)
- `literature.md`: short background notes, used as "research literature" (optional, but it improves the knowledge graph and hypotheses)

All datasets are **real public datasets** (UCI Machine Learning Repository). Download links are below, but you don't need to download anything because the files are already here.

---

## What the system actually does (in plain words)

You give it a **question** ("can X beat the standard model?") and a **CSV dataset**.
It then runs this loop by itself, up to *Maximum Iterations* times:

1. **Reads** your literature and builds a small knowledge graph of concepts.
2. **Asks the LLM (NVIDIA NIM)** for 4 hypotheses, e.g. *"Selecting the top 60% features by mutual information will improve F1"*. Each one comes with a concrete experiment recipe (model + feature-selection method + settings).
3. **Ranks** them: `Score = 0.30·Plausibility + 0.20·Novelty + 0.25·Testability + 0.25·Consistency`, then picks the best.
4. **Formal theory**: writes it as a math formula and checks it with SymPy (it must parse and contain variables).
5. **Experiment**: trains the proposed model **and** a baseline (a default Random Forest on all features) on your CSV, using 3 random seeds.
6. **Validates**: `V = 0.3·Consistency + 0.3·Agreement + 0.2·Novelty + 0.2·Reproducibility`
   - **Validated** = beats the baseline F1 by at least 1% and V ≥ 75. The loop stops here.
   - **Refine** = close, but not enough. The next iteration tweaks this idea.
   - **Reject** = worse than the baseline. It's recorded as a failure so it isn't tried again.
7. **Memory + report**: everything is saved, and the *Research Report* tab shows the final result.

**About the CSV:** the target column must be named `target`, `class`, `label`, `outcome` or `output`, or be the **last column**. All other columns are used as features.

---

## How to use a scenario (2 minutes)

1. Start the app (see the main README): `npm run dev:all`, then open **http://localhost:3000/create**
2. Copy the fields from a scenario below into the form.
3. Upload `dataset.csv` as **Dataset** and `literature.md` as **Literature**.
4. Create the project, open it, and click **Run Discovery Pipeline**. A run takes about 1–5 minutes (most of it is LLM time).
5. Watch the tabs: Knowledge Graph → Hypotheses → Theories → Experiments → Validation → Memory → **Research Report**.

> Quick alternative: on the home Dashboard, paste the *Research Question* into the prompt box, attach **both** `dataset.csv` and `literature.md` (the CSV becomes the dataset, the rest becomes literature), and press launch.

---

## Scenario 1: Heart disease: can feature selection remove noise? *(expected: Validated)*

Folder: `01_heart_disease_feature_selection/` · 303 patients · 13 clinical features + **4 fake noise columns** · target = `target`

| Field | Copy this |
|---|---|
| Problem Title | `Heart disease: does removing noise features beat random forest?` |
| Research Question | `Can feature selection or input normalisation improve F1 over a default random forest on the Cleveland heart-disease data, which contains irrelevant noise features?` |
| Domain | `Machine Learning` |
| Evaluation Metric | `F1 Score` |
| Maximum Iterations | `3` |
| Research Objective | `Find a preprocessing + model theory that beats the baseline F1 by at least 1%` |
| Operational Constraints | `Use only the provided tabular features; results must be stable across 3 seeds` |

**What to expect:** the baseline F1 is about 0.83. In our test run, iteration 1 (mutual-information filter) scored −1.6% and was marked **Refine**. Iteration 2 (correlation filter) scored +1.07% and was **Validated**. Your hypotheses will differ because the LLM is creative.

Source: https://archive.ics.uci.edu/dataset/45/heart+disease (file `processed.cleveland.data`)

---

## Scenario 2: Diabetes: which model family works best? *(expected: Validated or Refine)*

Folder: `02_diabetes_model_selection/` · 768 patients · 8 features · target = `Outcome`

| Field | Copy this |
|---|---|
| Problem Title | `Diabetes onset: model and preprocessing selection` |
| Research Question | `Which combination of model family (logistic regression, gradient boosting, random forest) and preprocessing (scaling, feature subset) gives the best F1 for predicting diabetes onset in the Pima dataset, compared with a default random forest?` |
| Domain | `Machine Learning` |
| Evaluation Metric | `F1 Score` |
| Maximum Iterations | `4` |
| Research Objective | `Discover a model theory that improves F1 over the random-forest baseline` |
| Operational Constraints | `Classes are imbalanced; prefer interpretable models when performance is similar` |

**What to expect:** baseline F1 ≈ 0.75. Scaled logistic regression measured about +1.2% in our checks, so a hypothesis in that direction can get validated. Tree-based hypotheses usually get rejected.

Source: https://www.kaggle.com/datasets/uciml/pima-indians-diabetes-database (originally UCI; mirror used: https://github.com/jbrownlee/Datasets/blob/master/pima-indians-diabetes.data.csv)

---

## Scenario 3: Breast cancer: are 30 correlated features needed? *(expected: Refine)*

Folder: `03_breast_cancer_redundant_features/` · 569 tumours · 30 highly correlated features · target = `target`

| Field | Copy this |
|---|---|
| Problem Title | `Breast cancer: compact non-redundant feature subset` |
| Research Question | `Can a compact subset of non-redundant features (removing near-duplicate measurements like radius/perimeter/area) match or beat a random forest that uses all 30 features for breast-cancer diagnosis?` |
| Domain | `Machine Learning` |
| Evaluation Metric | `F1 Score` |
| Maximum Iterations | `3` |
| Research Objective | `Reduce the number of features while keeping or improving F1` |
| Operational Constraints | `Use at most 60% of the original features` |

**What to expect:** the baseline is already ~0.97 F1, so gains are tiny (+0.2%). Expect mostly **Refine** decisions. This shows the system refining an idea across iterations instead of stopping at once.

Source: https://archive.ics.uci.edu/dataset/17/breast+cancer+wisconsin+diagnostic (also bundled in scikit-learn as `load_breast_cancer`)

---

## Scenario 4: Banknote forgery: the "nothing beats the baseline" case *(expected: Rejected)*

Folder: `04_banknote_rejection_case/` · 1372 banknotes · 4 features · target = `class`

| Field | Copy this |
|---|---|
| Problem Title | `Banknote authentication: can anything beat a 99% baseline?` |
| Research Question | `Can feature selection or a different model family improve F1 over a default random forest for detecting forged banknotes from wavelet image statistics?` |
| Domain | `Machine Learning` |
| Evaluation Metric | `F1 Score` |
| Maximum Iterations | `3` |
| Research Objective | `Test whether the framework correctly rejects hypotheses that cannot improve a near-perfect baseline` |
| Operational Constraints | `Only 4 features are available` |

**What to expect:** baseline F1 ≈ 0.99, and every alternative we tested was 2–6% worse. The system should **Reject** the hypotheses, store them in Memory as failures, and finish without a validated theory. This is the "honest negative result" the paper says the framework must produce instead of a false discovery.

Source: https://archive.ics.uci.edu/dataset/267/banknote+authentication

---

## Scenario 5: Radar returns: is the ionosphere signal "good" or "bad"? *(expected: Refine or Validated)*

Folder: `05_ionosphere_radar_signal/` · 351 radar returns · 34 signal features · target = `target` (1 good, 0 bad)

| Field | Copy this |
|---|---|
| Problem Title | `Ionosphere radar: does feature selection beat a random forest?` |
| Research Question | `Can removing redundant pulse-autocorrelation features, or using a scaled linear model, improve F1 over a default random forest for classifying ionosphere radar returns as good or bad?` |
| Domain | `Machine Learning` |
| Evaluation Metric | `F1 Score` |
| Maximum Iterations | `3` |
| Research Objective | `Find a preprocessing or model theory that beats the random-forest baseline F1 by at least 1%` |
| Operational Constraints | `Use only the provided radar features; results must be stable across 3 seeds` |

**What to expect (success):** baseline F1 (5-fold CV, random forest) ≈ **0.957**; scaled logistic regression ≈ 0.908. Random forest is already strong, so a validated theory needs a feature-subset idea, not a model swap. Success = V ≥ 75 and F1 gain ≥ 1%.

Source: https://archive.ics.uci.edu/dataset/52/ionosphere (file `ionosphere.data`; class `g` mapped to 1, `b` to 0)

---

## Scenario 6: Sonar: rock or metal cylinder? *(expected: Refine or Rejected)*

Folder: `06_sonar_rock_vs_mine/` · 208 sonar returns · 60 frequency-band features · target = `target` (1 mine, 0 rock)

| Field | Copy this |
|---|---|
| Problem Title | `Sonar: can band selection beat a random forest on a small dataset?` |
| Research Question | `Can selecting a subset of the 60 sonar frequency bands, or a different model family, improve F1 over a default random forest for telling metal cylinders from rocks?` |
| Domain | `Machine Learning` |
| Evaluation Metric | `F1 Score` |
| Maximum Iterations | `3` |
| Research Objective | `Test whether a band-selection theory generalises beyond the baseline on high-dimensional, small-sample data` |
| Operational Constraints | `Use at most 50% of the original features; results must be stable across 3 seeds` |

**What to expect (success):** baseline F1 (5-fold CV, random forest) ≈ **0.859**; scaled logistic regression ≈ 0.751. The gap is large, so a feature-selection hypothesis has room to win, but with 208 rows its gain can be noisy. Success = a Validated theory; an honest Reject is also a valid outcome.

Source: https://archive.ics.uci.edu/dataset/151/connectionist+bench+sonar+mines+vs+rocks

---

## Scenario 7: Parkinson's: can voice measurements detect the disease? *(expected: Validated or Refine)*

Folder: `07_parkinsons_voice/` · 195 voice recordings · 22 voice features · target = `target` (1 Parkinson's, 0 healthy)

| Field | Copy this |
|---|---|
| Problem Title | `Parkinson's from voice: compact feature subset vs random forest` |
| Research Question | `Can a compact subset of jitter, shimmer and nonlinear voice features, or a scaled linear model, improve F1 over a default random forest for detecting Parkinson's disease from voice recordings?` |
| Domain | `Machine Learning` |
| Evaluation Metric | `F1 Score` |
| Maximum Iterations | `3` |
| Research Objective | `Find a voice-feature theory that beats the random-forest baseline F1 by at least 1%` |
| Operational Constraints | `Classes are imbalanced; prefer interpretable models when performance is similar` |

**What to expect (success):** baseline F1 (5-fold CV, random forest) ≈ **0.947**; scaled logistic regression ≈ 0.907. Recordings from the same person can inflate scores, so a small gain may not hold across seeds. Success = V ≥ 75 with a ≥ 1% F1 gain.

Source: https://archive.ics.uci.edu/dataset/174/parkinsons (file `parkinsons.data`; `status` renamed to `target`, `name` removed)

---

## Using your own data

Any classification CSV works: one row per sample, numeric or text columns, and the target in a column named `target` (or the last column). Write your question as *"Can <method idea> improve F1 over a default random forest on <your data>?"*. Optionally add a `.md`, `.txt`, `.pdf` or `.docx` with background knowledge. Good sources for more datasets are https://archive.ics.uci.edu and https://www.kaggle.com/datasets.
