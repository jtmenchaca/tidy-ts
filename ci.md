# Causal Inference Functions

## Core Statistical Functions
- `glm()` - Generalized linear models (logistic, linear)
- `lm()` - Linear regression
- `geeglm()` - Generalized estimating equations (geepack)
- `tsls()` - Two-stage least squares (sem)
- `predict()` - Model predictions
- `summary()` - Model summaries
- `confint()` - Confidence intervals
- `t.test()` - T-tests
- `survfit()` - Kaplan-Meier survival curves (survival)
- `survdiff()` - Log-rank test (survival)
- `boot()` - Bootstrap resampling (boot)
- `optimize()` - Optimization
- `solve()` - Matrix solving
- `table()` - Cross-tabulation
- `prop.table()` - Proportions
- `mean()` - Mean calculation
- `sd()` - Standard deviation
- `cut()` - Categorical binning
- `quantile()` - Quantile calculations
- `expandRows()` - Data expansion (splitstackshape)
- `cumprod()` - Cumulative product
- `describe()` - Descriptive stats (Hmisc)
- `glht()` - General linear hypotheses (multcomp)
- `xtabs()` - Cross-tabulation
- `ifelse()` - Conditional operations
- `which()` - Index selection
- `is.na()` - Missing value check
- `subset()` - Data subsetting
- `rbind()` - Row binding
- `cbind()` - Column binding
- `rep()` - Replication
- `seq()` - Sequence generation
- `matrix()` - Matrix creation
- `t()` - Matrix transpose
- `%*%` - Matrix multiplication
- `qnorm()` - Normal quantiles
- `dnorm()` - Normal density
- `factor()` - Factor creation
- `as.factor()` - Convert to factor
- `I()` - As-is operator

## Required Packages
- **geepack** - GEE models
- **sem** - 2SLS
- **survival** - Survival analysis
- **multcomp** - Contrasts
- **boot** - Bootstrap
- **Hmisc** - Descriptive stats
- **splitstackshape** - Data expansion
- **readxl** - Excel files
- **ggplot2** - Plotting
- **dplyr** - Data manipulation
- **survminer** - Survival plots

## Reference Files
- `src/dataframe/rust/dataframe/CausalInference/chapter11.R` - Basic statistical functions
- `src/dataframe/rust/dataframe/CausalInference/chapter12.R` - Inverse probability weighting
- `src/dataframe/rust/dataframe/CausalInference/chapter13.R` - Standardization
- `src/dataframe/rust/dataframe/CausalInference/chapter14.R` - G-estimation
- `src/dataframe/rust/dataframe/CausalInference/chapter15.R` - Propensity scores
- `src/dataframe/rust/dataframe/CausalInference/chapter16.R` - Instrumental variables
- `src/dataframe/rust/dataframe/CausalInference/chapter17.R` - Survival analysis

## Function Relationships
- **`glm()`** → `predict()` → `summary()` → `confint()`
- **`geeglm()`** → `coef()` → `qnorm()` → confidence intervals
- **`tsls()`** → `summary()` → `confint()`
- **`survfit()`** → `survdiff()` → survival analysis
- **`boot()`** → `sd()` → `qnorm()` → bootstrap confidence intervals
- **`optimize()`** → `solve()` → matrix operations
- **`table()`** → `prop.table()` → `xtabs()` → cross-tabulation
- **`cut()`** → `quantile()` → categorical binning
- **`expandRows()`** → `cumprod()` → survival analysis
- **`glht()`** → `confint()` → contrast analysis
- **`describe()`** → `summary()` → descriptive statistics
- **`ifelse()`** → `which()` → `is.na()` → conditional operations
- **`rbind()`** → `cbind()` → data manipulation
- **`matrix()`** → `t()` → `%*%` → matrix operations
- **`factor()`** → `as.factor()` → categorical variables
- **`I()`** → `*` → `:` → `^` → formula operators