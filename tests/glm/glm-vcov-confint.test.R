#!/usr/bin/env Rscript

# Test vcov(), confint(), and residuals() methods for GLM
# These tests validate TypeScript implementations against R

cat("=== GLM vcov/confint/residuals Tests ===\n\n")

# Test 1: Gaussian GLM - vcov and confint
cat("Test 1: Gaussian GLM - vcov and confint\n")
model1 <- glm(mpg ~ wt + hp, data = mtcars, family = gaussian())
cat("Coefficients:\n")
print(coef(model1))
cat("\nVcov matrix:\n")
print(vcov(model1))
cat("\nConfidence intervals (95%):\n")
# Use Wald method for consistency (confint.default behavior)
ci1 <- confint.default(model1, level = 0.95)
print(ci1)
cat("\n")

# Test 2: Binomial GLM - vcov and confint
cat("Test 2: Binomial GLM - vcov and confint\n")
model2 <- glm(vs ~ mpg + wt, data = mtcars, family = binomial())
cat("Coefficients:\n")
print(coef(model2))
cat("\nVcov matrix:\n")
print(vcov(model2))
cat("\nConfidence intervals (95%):\n")
ci2 <- confint.default(model2, level = 0.95)
print(ci2)
cat("\n")

# Test 3: Poisson GLM - vcov and confint
cat("Test 3: Poisson GLM - vcov and confint\n")
# Create count data
model3 <- glm(carb ~ wt + hp, data = mtcars, family = poisson())
cat("Coefficients:\n")
print(coef(model3))
cat("\nVcov matrix:\n")
print(vcov(model3))
cat("\nConfidence intervals (95%):\n")
ci3 <- confint.default(model3, level = 0.95)
print(ci3)
cat("\n")

# Test 4: Different confidence levels
cat("Test 4: Different confidence levels (90% and 99%)\n")
model4 <- glm(mpg ~ wt, data = mtcars, family = gaussian())
cat("90% CI:\n")
ci4_90 <- confint.default(model4, level = 0.90)
print(ci4_90)
cat("\n99% CI:\n")
ci4_99 <- confint.default(model4, level = 0.99)
print(ci4_99)
cat("\n")

# Test 5: Residuals - all types
cat("Test 5: Residuals - all types\n")
model5 <- glm(vs ~ mpg + wt, data = mtcars, family = binomial())
cat("First 5 observations:\n")
cat("Deviance residuals:\n")
print(head(residuals(model5, type = "deviance"), 5))
cat("\nPearson residuals:\n")
print(head(residuals(model5, type = "pearson"), 5))
cat("\nWorking residuals:\n")
print(head(residuals(model5, type = "working"), 5))
cat("\nResponse residuals:\n")
print(head(residuals(model5, type = "response"), 5))
cat("\n")

# Test 6: Subset of parameters for confint
cat("Test 6: Subset of parameters for confint\n")
model6 <- glm(mpg ~ wt + hp + qsec, data = mtcars, family = gaussian())
cat("All coefficients:\n")
print(coef(model6))
cat("\nConfidence intervals for wt and hp only:\n")
ci6 <- confint.default(model6, parm = c("wt", "hp"), level = 0.95)
print(ci6)
cat("\n")

cat("=== All Tests Complete ===\n")
