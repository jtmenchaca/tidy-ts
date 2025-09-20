# Chapter 17 - Survival Analysis

## Core Functions
- **`survfit()`** - Kaplan-Meier survival curves
- **`survdiff()`** - Log-rank test
- **`glm()`** - Hazard models
- **`expandRows()`** - Data expansion (splitstackshape)
- **`optimize()`** - Optimization
- **`cumprod()`** - Cumulative product

## Statistical Models
- **Kaplan-Meier**: `survfit(Surv(time, event) ~ treatment)`
- **Hazard models**: `glm(event==0 ~ treatment + time + time^2, family=binomial())`
- **IP-weighted hazards**: `glm(event==0 ~ treatment + time, weight=sw.a)`
- **G-formula hazards**: `glm(event==0 ~ treatment + time + confounders)`

## Survival Methods
- **Nonparametric**: Product-limit estimates
- **Parametric**: Hazard models with time polynomials
- **IP-weighted**: Inverse probability weighted hazards
- **G-formula**: Standardized survival curves
- **AFT models**: Accelerated failure time estimation

## Data Operations
- **Person-time data**: `expandRows(data, "survtime")`
- **Event indicators**: `ifelse(time == survtime-1 & death==1, 1, 0)`
- **Survival calculation**: `cumprod(1-hazard)`
- **Time variables**: `time^2`, `sequence(rle()$lengths)-1`

## Optimization
- **Estimating equations**: Custom `sumeef()` function
- **Bisection method**: Root finding for confidence intervals
- **Matrix operations**: `solve()`, `t()`, `%*%`
