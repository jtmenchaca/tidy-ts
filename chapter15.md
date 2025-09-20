# Chapter 15 - Propensity Scores

## Core Functions
- **`glm()`** - Logistic regression for propensity scores
- **`glht()`** - General linear hypotheses (multcomp)
- **`t.test()`** - T-tests
- **`cut()`** - Categorical binning
- **`quantile()`** - Quantile calculations
- **`boot()`** - Bootstrap resampling

## Statistical Models
- **Propensity score models**: `glm(treatment ~ confounders, family=binomial())`
- **Effect modification**: `glm(outcome ~ treatment + confounders + treatment:confounder)`
- **Stratified models**: `glm(outcome ~ treatment + factor(ps.dec))`

## Propensity Score Methods
- **Score calculation**: `predict(model, type="response")`
- **Decile creation**: `cut(ps, breaks=quantile(ps, probs=seq(0,1,0.1)))`
- **Stratification**: `t.test(outcome ~ treatment, data=subset)`

## Contrast Analysis
- **Contrast matrix**: `makeContrastMatrix()`
- **Linear hypotheses**: `glht(model, contrast_matrix)`
- **Confidence intervals**: `confint(estimates)`

## Bootstrap Functions
- **Custom statistic**: `std.ps()` function
- **Bootstrap**: `boot(data, statistic, R=5)`
- **Confidence intervals**: `qnorm(0.975) * se`
