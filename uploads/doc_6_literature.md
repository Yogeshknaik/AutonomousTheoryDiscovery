# Background notes: Diabetes onset prediction (Pima Indians)

Source dataset: Pima Indians Diabetes Database, National Institute of Diabetes and Digestive
and Kidney Diseases (Smith et al., 1988). 768 female patients of Pima heritage, aged 21+.
`Outcome` = 1 if diabetes was diagnosed within five years.

## Known facts
- Plasma glucose concentration (Glucose) is the dominant predictor; BMI, Age and
  DiabetesPedigreeFunction follow.
- Zero values in Glucose, BloodPressure, SkinThickness, Insulin and BMI are physiologically
  impossible and actually mean "missing". Insulin and SkinThickness are missing very often.
- Classes are imbalanced (about 35% positive), so F1 is a better metric than accuracy.

## Methods relevant to this problem
- Logistic regression on scaled features is a well-calibrated, interpretable baseline.
- Gradient boosting and random forests capture interactions (e.g. Glucose x BMI).
- Dropping the noisy, frequently-missing features (Insulin, SkinThickness) may reduce variance.

## Open question
Which model family and preprocessing (scaling, feature subset) gives the best F1 for
predicting diabetes onset compared with a default random forest?
