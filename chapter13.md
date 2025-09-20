# Chapter 13 - Standardization

## Core Functions
- **`glm()`** - Linear regression models
- **`predict()`** - Model predictions
- **`mean()`** - Mean calculations
- **`boot()`** - Bootstrap resampling
- **`summary()`** - Model summaries

## Statistical Models
- **Outcome models**: `glm(outcome ~ treatment + confounders)`
- **Interaction models**: `glm(Y ~ A*L)` (treatment × confounder)
- **Standardization**: Create 3 copies of data (observed, treated=0, treated=1)

## Bootstrap Functions
- **`boot()`** - Bootstrap with custom statistic function
- **`sd()`** - Standard deviation for bootstrap SE
- **`qnorm()`** - Normal quantiles for confidence intervals

## Data Operations
- **Data manipulation**: `rbind()`, `cbind()`, `rep()`
- **Conditional means**: `mean(data[condition,]$var)`
- **Missing value handling**: `is.na()`, `!is.na()`
