# Background notes: Feature selection for heart-disease prediction

Source dataset: UCI Machine Learning Repository, Heart Disease (Cleveland subset),
Janosi, Steinbrunn, Pfisterer & Detrano (1988). 303 patients, 13 clinical attributes.
`target` = 1 if angiographic disease is present (original `num` > 0), else 0.

## Known facts
- Chest pain type (cp), maximum heart rate achieved (thalach), ST depression induced by
  exercise (oldpeak), number of major vessels coloured by fluoroscopy (ca) and thallium
  stress test result (thal) are commonly reported as the most predictive attributes.
- Serum cholesterol (chol) and fasting blood sugar (fbs) are usually weak predictors here.
- Columns `noise_1` .. `noise_4` were ADDED to this copy as pure Gaussian noise. They carry
  no information about the target. A good feature-selection method should discard them.

## Methods relevant to this problem
- Filter methods: mutual information, absolute Pearson correlation with the target.
- Embedded methods: random-forest impurity importance.
- Hybrid methods: combine a filter score and an embedded score after min-max normalisation.
- Linear models such as logistic regression benefit from feature scaling (normalisation).
- Random forest is a strong, hard-to-beat baseline on small tabular medical datasets.

## Open question
Does removing irrelevant (noise) features or rescaling inputs improve F1 over a
default random forest trained on all features?
