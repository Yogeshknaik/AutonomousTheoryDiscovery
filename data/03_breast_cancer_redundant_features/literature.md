# Background notes: Redundant features in breast-cancer diagnosis

Source dataset: Breast Cancer Wisconsin (Diagnostic), Wolberg, Street & Mangasarian (1995),
UCI Machine Learning Repository (copy bundled with scikit-learn). 569 tumour samples.
`target` = 1 benign, 0 malignant.

## Known facts
- 30 features = 10 cell-nucleus measurements (radius, texture, perimeter, area, smoothness,
  compactness, concavity, concave points, symmetry, fractal dimension) x 3 statistics
  (mean, standard error, worst).
- Many features are highly correlated: radius, perimeter and area are almost collinear.
- "Worst" and "mean" concave points, radius and perimeter are the strongest predictors.
- Default classifiers already reach about 95-97% accuracy, so gains are small.

## Methods relevant to this problem
- Correlation- or mutual-information-based selection removes redundant features.
- Feature scaling strongly affects logistic regression because feature ranges differ by
  orders of magnitude (area ~ 1000 vs smoothness ~ 0.1).

## Open question
Can a compact subset of non-redundant features match or beat a random forest that uses all
30 features?
