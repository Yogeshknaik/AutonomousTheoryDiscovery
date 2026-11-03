# Background notes: Banknote authentication

Source dataset: Banknote Authentication, Volker Lohweg (2012), UCI Machine Learning
Repository. 1372 images of genuine and forged banknotes, described by 4 wavelet-transform
statistics: variance, skewness, curtosis, entropy. `class` = 1 forged, 0 genuine.

## Known facts
- The classes are almost perfectly separable; a default random forest reaches ~99% F1.
- Variance and skewness of the wavelet-transformed image are the most informative features.
- With only 4 features there is little room for feature selection.

## Open question
Can any feature-selection or model change improve on a ~99% F1 random-forest baseline?
(Expected answer: probably not. This scenario shows the system REJECTING hypotheses and
recording the failures in memory instead of claiming a false discovery.)
