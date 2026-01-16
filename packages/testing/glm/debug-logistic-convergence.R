#!/usr/bin/env Rscript
# Debug logistic regression convergence

data <- data.frame(
  y = c(0, 1, 0, 1, 1, 0),
  x1 = c(1.2, 2.5, 1.8, 3.2, 2.9, 1.5),
  x2 = c(3, 5, 2, 7, 6, 3)
)

cat("=== Logistic Regression Detailed Analysis ===\n\n")

# Fit with trace to see iterations
model <- glm(y ~ x1 + x2, family = binomial(link = "logit"), data = data,
             control = glm.control(trace = TRUE, maxit = 25))

cat("\n=== Final Results ===\n")
cat("Converged:", model$converged, "\n")
cat("Iterations:", model$iter, "\n")
cat("Deviance:", deviance(model), "\n")
cat("AIC:", AIC(model), "\n\n")

options(digits = 20)
cat("Coefficients (full precision):\n")
print(coef(model))

cat("\nStandard errors:\n")
print(summary(model)$coefficients[, "Std. Error"])

cat("\nFitted values:\n")
print(fitted(model))

cat("\nLinear predictors:\n")
print(model$linear.predictors)
