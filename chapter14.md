# Chapter 14 - G-Estimation

## Core Functions
- **`geeglm()`** - Generalized estimating equations
- **`glm()`** - Logistic regression
- **`solve()`** - Matrix solving
- **`optimize()`** - Optimization
- **`describe()`** - Descriptive statistics (Hmisc)

## Statistical Models
- **Censoring weights**: `glm(cens==0 ~ covariates, family=binomial())`
- **G-estimation models**: `geeglm(treatment ~ confounders + Hpsi)`
- **Logistic models**: `glm(treatment ~ confounders, family=binomial())`

## G-Estimation Methods
- **Brute force search**: Grid search over psi values
- **Closed form estimator**: Matrix solution for 1-parameter model
- **2-parameter model**: `psi = solve(lhs, rhs)`

## Matrix Operations
- **Matrix construction**: `matrix(0, nrow, ncol)`
- **Matrix solving**: `solve(lhs, rhs)`
- **Matrix operations**: `t()`, `%*%`

## Data Operations
- **Weighted models**: `weight = wc`
- **Conditional selection**: `which()`, `!is.na()`
