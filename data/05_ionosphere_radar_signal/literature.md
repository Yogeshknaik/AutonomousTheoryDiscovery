# Background notes: Ionosphere radar returns

Source dataset: Ionosphere, Vince Sigillito et al. (1989), Johns Hopkins University Applied
Physics Laboratory, UCI Machine Learning Repository. 351 radar returns from a phased-array
system in Goose Bay, Labrador. Each return has 34 continuous attributes (17 pulses x real/imaginary
parts of complex autocorrelation). `target` = 1 "good" (structure detected in the ionosphere), 0 "bad".

## Known facts
- Attributes are ordered by pulse; the same kind of signal appears in neighbouring attribute pairs.
- Many attributes are correlated, so feature selection can remove redundancy.
- Classes are moderately imbalanced (225 good vs 126 bad).
- Reported k-NN and SVM accuracies in the literature are around 90-96%.

## Open question
Can a feature subset, scaling, or a different model family improve F1 over a default random forest?
