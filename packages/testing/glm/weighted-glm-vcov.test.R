#!/usr/bin/env Rscript

# Test weighted GLM with vcov() and confint()
# This checks if edge cases affect variance-covariance and confidence intervals

cat("=== Weighted GLM vcov/confint Edge Case Tests ===\n\n")

# Test 1: Normal weighted GLM - baseline
cat("Test 1: Normal weighted GLM - baseline\n")
x <- c(1, 2, 3, 4, 5)
y <- c(2.1, 4.2, 5.8, 8.1, 10.3)
weights <- c(1, 1, 2, 2, 1)
model1 <- glm(y ~ x, family = gaussian(link = "identity"), weights = weights)
cat("Coefficients:\n")
print(coef(model1))
cat("\nVcov matrix:\n")
print(vcov(model1))
cat("\nConfidence intervals (95%):\n")
print(confint.default(model1, level = 0.95))
cat("\n")

# Test 2: Single non-zero weight - edge case
cat("Test 2: Single non-zero weight - edge case\n")
weights2 <- c(0, 0, 0, 0, 1)
model2 <- glm(y ~ x, family = gaussian(link = "identity"), weights = weights2)
cat("Coefficients:\n")
print(coef(model2))
cat("\nVcov matrix:\n")
print(vcov(model2))
cat("\nNote: Slope is NA because only one observation\n")
cat("\n")

# Test 3: Identical x values - edge case
cat("Test 3: Identical x values with different weights - edge case\n")
x3 <- c(1, 1, 1, 1, 1)
y3 <- c(2.1, 4.2, 5.8, 8.1, 10.3)
weights3 <- c(1, 2, 3, 4, 5)
model3 <- glm(y3 ~ x3, family = gaussian(link = "identity"), weights = weights3)
cat("Coefficients:\n")
print(coef(model3))
cat("\nVcov matrix:\n")
print(vcov(model3))
cat("\nNote: Slope is NA because all x values are identical\n")
cat("\n")

# Test 4: Single observation
cat("Test 4: Single observation\n")
x4 <- c(1)
y4 <- c(2.1)
weights4 <- c(1)
model4 <- glm(y4 ~ x4, family = gaussian(link = "identity"), weights = weights4)
cat("Coefficients:\n")
print(coef(model4))
cat("\nVcov matrix:\n")
print(vcov(model4))
cat("\nNote: Slope is NA because only one observation\n")
cat("\n")

# Test 5: Very small weights
cat("Test 5: Very small weights\n")
weights5 <- c(1e-10, 1e-8, 1e-6, 1e-4, 1e-2)
model5 <- glm(y ~ x, family = gaussian(link = "identity"), weights = weights5)
cat("Coefficients:\n")
print(coef(model5))
cat("\nVcov matrix:\n")
print(vcov(model5))
cat("\nConfidence intervals (95%):\n")
print(confint.default(model5, level = 0.95))
cat("\n")

# Test 6: Binomial with weights and vcov
cat("Test 6: Binomial with weights and vcov\n")
successes <- c(8, 12, 15, 18, 20)
trials <- c(10, 15, 20, 25, 30)
x6 <- c(1, 2, 3, 4, 5)
y6 <- successes / trials
model6 <- glm(y6 ~ x6, family = binomial(link = "logit"), weights = trials)
cat("Coefficients:\n")
print(coef(model6))
cat("\nVcov matrix:\n")
print(vcov(model6))
cat("\nConfidence intervals (95%):\n")
print(confint.default(model6, level = 0.95))
cat("\n")

cat("=== All Tests Complete ===\n")
