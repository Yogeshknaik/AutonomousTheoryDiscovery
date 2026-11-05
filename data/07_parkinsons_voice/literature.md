# Background notes: Parkinson's disease from voice measurements

Source dataset: Parkinsons, Max Little (University of Oxford) with the National Centre for Voice and
Speech, Denver (2008), UCI Machine Learning Repository. 195 voice recordings from 31 people,
23 of whom have Parkinson's disease. `target` = 1 Parkinson's (`status` column), 0 healthy.
The `name` column (recording id) is removed. The 22 remaining features are voice measures:
frequency (MDVP:Fo, Fhi, Flo), jitter, shimmer, noise ratios (NHR, HNR), and nonlinear
complexity measures (RPDE, DFA, spread1, spread2, D2, PPE).

## Known facts
- Several recordings come from the same person, so random train/test splits can be optimistic.
- Jitter and shimmer (cycle-to-cycle variation) are the classic markers of voice impairment.
- Classes are imbalanced (147 Parkinson's vs 48 healthy), so F1 is more informative than accuracy.
- Many features are correlated (the MDVP and Shimmer families), so feature selection may help.

## Open question
Can a compact voice-feature subset or a scaled linear model match or beat a default random forest F1?
