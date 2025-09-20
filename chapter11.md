# Chapter 11 - Basic Statistical Functions

## Core Functions
- **`summary()`** - Descriptive statistics by group
- **`glm()`** - Generalized linear models (2-parameter, 3-parameter)
- **`predict()`** - Model predictions
- **`plot()`** - Basic plotting

## Statistical Models
- Linear regression: `glm(Y ~ A)`
- Quadratic regression: `glm(Y ~ A + A^2)`
- Prediction at specific values: `predict(model, data.frame(A=90))`

## Data Operations
- Group-wise summaries: `summary(Y[A==0])`, `summary(Y[A==1])`
- Basic arithmetic: `A^2` for squared terms
