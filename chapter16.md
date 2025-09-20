# Chapter 16 - Instrumental Variables

## Core Functions
- **`tsls()`** - Two-stage least squares (sem package)
- **`geeglm()`** - G-estimation for IV
- **`t.test()`** - T-tests
- **`summary()`** - Model summaries
- **`confint()`** - Confidence intervals

## Statistical Models
- **2SLS models**: `tsls(outcome ~ treatment, ~ instrument, data)`
- **G-estimation IV**: `geeglm(instrument ~ Hpsi, family=binomial())`
- **Conditional IV**: `tsls(outcome ~ treatment + covariates, ~ instrument + covariates)`

## IV Methods
- **Standard IV estimator**: Sample averages by instrument
- **2SLS regression**: Two-stage least squares
- **G-estimation**: `Hpsi = outcome - psi * treatment`
- **Multiple instruments**: Different threshold values

## Data Operations
- **Instrument creation**: `ifelse(price >= threshold, 1, 0)`
- **Cross-tabulation**: `table(instrument, treatment)`
- **Missing data**: `!is.na(outcome) & !is.na(instrument)`

## Confidence Intervals
- **Normal approximation**: `beta ± qnorm(0.975) * SE`
- **Coefficient extraction**: `coef(model)`, `coef(summary(model))[,2]`
