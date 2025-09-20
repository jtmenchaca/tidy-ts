# Chapter 12 - Inverse Probability Weighting

## Core Functions
- **`glm()`** - Logistic regression for propensity scores
- **`geeglm()`** - Generalized estimating equations (GEE)
- **`lm()`** - Linear regression
- **`predict()`** - Model predictions
- **`summary()`** - Model summaries
- **`confint()`** - Confidence intervals

## Statistical Models
- **Propensity score models**: `glm(qsmk ~ covariates, family=binomial())`
- **Marginal structural models**: `geeglm(outcome ~ treatment, weights=w)`
- **Continuous treatment models**: `lm(treatment ~ covariates)`
- **Logistic MSM**: `geeglm(death ~ qsmk, family=binomial())`

## Weight Calculations
- **IP weights**: `w = 1/p.qsmk.obs`
- **Stabilized weights**: `sw = (pn.qsmk/pd.qsmk)`
- **Normal density**: `dnorm(x, mean, sd)`

## Data Operations
- **Cross-tabulation**: `table()`, `prop.table()`
- **Conditional summaries**: `summary(data[condition,]$var)`
- **Matrix operations**: `xtabs()`
