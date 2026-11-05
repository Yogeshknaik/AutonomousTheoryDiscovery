# Background notes: Sonar, rock vs metal cylinder

Source dataset: Sonar, Terry Sejnowski and R. Paul Gorman (1988), UCI Machine Learning Repository.
208 sonar returns bounced off a metal cylinder (mine, `target` = 1) or a rock (`target` = 0).
Each return is described by 60 real-valued energy bands (frequency bins) over time.

## Known facts
- The signal is high-dimensional (60 features) with only 208 samples, so overfitting is the main risk.
- Neighbouring frequency bands are strongly correlated.
- Scaling matters for linear models: a scaled logistic regression is clearly worse than a random forest here.
- Reported accuracy in the original work was around 90% with a neural network; random forests typically reach 80-88%.

## Open question
Can feature selection (dropping correlated or weak bands) or a different model family beat a default
random forest F1 on this small, high-dimensional dataset?
