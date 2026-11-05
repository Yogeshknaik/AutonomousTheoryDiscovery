# How to Use the Autonomous Theory Discovery App

**What it does:** you give it a research question and a CSV table of data. It proposes ideas, tests each one against a standard model on your data, keeps the ones that work, and discards the rest.

**Start the app:** `npm run dev:all`, then open http://localhost:3000

---

## Quick start (copy and paste)

1. Go to **http://localhost:3000/create**.
2. Paste the fields from a scenario in [data/README.md](data/README.md).
3. Upload `dataset.csv` as the **Dataset**, and `literature.md` as **Literature** (optional).
4. Open the project and click **Run Discovery Pipeline**. It takes about 1–5 minutes.
5. Read the **Research Report** tab for the final answer.

---

## Sample scenarios (in the `data/` folder)

| Folder | Data | Question | Expected result |
|---|---|---|---|
| `01_heart_disease_feature_selection` | Heart disease, 303 patients, 4 fake noise columns added | Can removing useless columns beat a standard random forest? | **Validated** (the correlation filter won by +1.07% F1) |
| `02_diabetes_model_selection` | Pima diabetes, 768 patients | Which model and preprocessing predict diabetes best? | Validated or Refine |
| `03_breast_cancer_redundant_features` | Breast cancer, 569 tumours, 30 correlated measurements | Can fewer, non-duplicate features match the full set? | Refine (baseline is already ~97%) |
| `04_banknote_rejection_case` | Banknote authenticity, 1372 notes | Can anything beat a 99% baseline? | **Rejected** (an honest "no") |

Each folder has `dataset.csv` (the data) and `literature.md` (background notes). The exact form text for each is in [data/README.md](data/README.md).

**Using your own data:** upload any CSV with one row per example and the answer column named `target` (or as the last column).

---

## What automated theory discovery does (examples)

The system does the research loop a scientist does, without a person doing each step: it proposes an idea, tests it, and keeps or discards it based on the evidence. It does not prove scientific laws. It only shows whether an idea beats a baseline on the data you give it.

### Example 1: Heart disease (feature selection)

**Question:** "Can removing weak columns predict heart disease better than the standard model?"

1. Reads the data: 303 patients, 13 measurements, plus 4 fake noise columns.
2. Proposes ideas, such as "keep the 60% most correlated features."
3. Checks each idea's formula for validity.
4. Tests each idea 3 times against a standard random forest.
5. Decides:

| Idea | F1 vs. standard | Decision |
|---|---|---|
| Mutual-information filter | −1.6% | Refine |
| Correlation filter | +1.07% | Validated |

6. Remembers the failed idea so the next round won't repeat it.

### Example 2: Diabetes (model selection)

**Question:** "Can a different model predict diabetes better than the standard random forest?"

1. Reads the data: 768 patients, 8 measurements, answer column `Outcome`.
2. Proposes ideas, such as "scaled logistic regression" and "gradient boosting."
3. Checks each idea's formula for validity.
4. Tests each idea 3 times against the standard random forest.
5. Decides:

| Idea | F1 vs. standard | Decision |
|---|---|---|
| Scaled logistic regression | +1.2% | Validated |
| Gradient boosting | −1.4% | Rejected |

6. Remembers the failed idea so the next round won't repeat it.

**Caveat:** these are results from my test runs. The AI proposes different ideas each time, so your run may differ.

---

## Every screen, in one line each

Use the left sidebar to move between them. Choose the project in the dropdown at the top of each screen.

| Screen | What it shows | Example (heart disease scenario) |
|---|---|---|
| **Discovery Studio** (home) | Type a question, attach files, launch a run. The **Citation S(d,q)** switch decides whether attached papers are used. | Type the question, attach `dataset.csv` and `literature.md`, switch Citation ON. |
| **Methodology Flowchart** | The 7 stages of the run, filling in live. | Shows "19 graph entities" and "8 ranked candidates". |
| **Knowledge Retrieval S(d,q)** | Concepts pulled from your data and papers, with relevance scores. | Cards such as "target variable" and "angiographic disease presence". |
| **Hypothesis Generator h\*** | The ideas the AI proposed, ranked. Each gets a status: Validated, Refined or Rejected. | "Correlation Filter Enhances F1": Validated, overall 85.5%. |
| **Automated Experiments E_pred** | The code run on your data for each idea, and whether it finished. | `Experiment_9_Iter2`: COMPLETED. |
| **Composite Validation V(h)** | The verdict for each tested idea, with its four scores. | Refine (79.86, lost −1.58% F1). Validated (87.45, gained +1.07% F1). |
| **Discovery Memory H_t+1** | A log of what was tried and learned, in order. | Iteration 1 failed, iteration 2 succeeded. Later runs avoid the failed idea. |
| **Measured Results (Tables II & III)** | Averages across all your runs: quality scores and decision counts. | Current data: consistency 100%, agreement 73.3%, 2 validated, 1 refined. |
| **Research Report** | One-page summary of the best result. | Title, validated idea, baseline F1 0.833 → 0.842. |
| **Velocity / Weights panel** (Validation Formula Weights) | Sets how much each part of the score counts. | Raise Agreement to 0.6 to favour ideas that truly beat the baseline. |

---

## How the scores work (short)

**Each tested idea gets a validation score out of 100:**

`Score = 100 × (0.3 × Consistency + 0.3 × Agreement + 0.2 × Novelty + 0.2 × Reproducibility)`

- **Consistency:** 1 if the idea's math formula is valid, otherwise 0.
- **Agreement:** based on the F1 gain over the standard model (gain ≥ 3% → 0.95; any gain → 0.75; small loss → 0.50; bigger loss → 0.20).
- **Novelty:** the AI's rating of how new the idea is.
- **Reproducibility:** how stable the F1 is across 3 random seeds.

**Decision:** Validated needs a score ≥ 75 **and** an F1 gain ≥ 1%. Otherwise it is Refine (try again) or Rejected.

**Example:** consistency 1, agreement 0.75, novelty 0.76, reproducibility 0.99 → 0.3 + 0.225 + 0.152 + 0.198 = **87.45 → Validated** (if the gain is ≥ 1%).

---

## Common problems

- **"Attach a .csv dataset":** the dataset must be a CSV. PDFs and text files are literature only.
- **Run fails with "no valid hypotheses":** the AI didn't return usable ideas. Check `NVIDIA_API_KEY` in `.env`, then run again.
- **Page shows old results:** restart with `npm run dev:all`.
- **Measured Results shows "n/a":** no discovery has finished yet. Run one first.
