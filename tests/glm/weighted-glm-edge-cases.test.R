# Weighted GLM Edge Cases Test
# This test explores edge cases and boundary conditions for weighted GLM

cat("=== Weighted GLM Edge Cases Test ===\n")

# Test 1: Very small weights
cat("\n=== Test 1: Very small weights ===\n")
x <- c(1, 2, 3, 4, 5)
y <- c(2.1, 4.2, 5.8, 8.1, 10.3)
weights <- c(1e-10, 1e-8, 1e-6, 1e-4, 1e-2)

model1 <- glm(y ~ x, family = gaussian(link = "identity"), weights = weights)
cat("Coefficients:\n")
print(model1$coefficients)
cat("Fitted values:\n")
print(model1$fitted.values)

# Test 2: Very large weights
cat("\n=== Test 2: Very large weights ===\n")
weights2 <- c(1e2, 1e4, 1e6, 1e8, 1e10)

model2 <- glm(y ~ x, family = gaussian(link = "identity"), weights = weights2)
cat("Coefficients:\n")
print(model2$coefficients)
cat("Fitted values:\n")
print(model2$fitted.values)

# Test 3: Mixed extreme weights
cat("\n=== Test 3: Mixed extreme weights ===\n")
x3 <- c(1, 2, 3, 4, 5)
y3 <- c(1, 2, 3, 4, 5)  # Perfect linear relationship
weights3 <- c(1e10, 1e-10, 1e10, 1e-10, 1e10)

model3 <- glm(y3 ~ x3, family = gaussian(link = "identity"), weights = weights3)
cat("Coefficients:\n")
print(model3$coefficients)
cat("Fitted values:\n")
print(model3$fitted.values)

# Test 4: Single non-zero weight
cat("\n=== Test 4: Single non-zero weight ===\n")
weights4 <- c(0, 0, 0, 0, 1)

model4 <- glm(y ~ x, family = gaussian(link = "identity"), weights = weights4)
cat("Coefficients:\n")
print(model4$coefficients)
cat("Fitted values:\n")
print(model4$fitted.values)

# Test 5: Binomial with extreme weights
cat("\n=== Test 5: Binomial with extreme weights ===\n")
successes <- c(1, 9, 1, 9, 1)
trials <- c(10, 10, 10, 10, 10)
x5 <- c(1, 2, 3, 4, 5)
y5 <- successes / trials
weights5 <- c(1e-6, 1e6, 1e-6, 1e6, 1e-6)

model5 <- glm(y5 ~ x5, family = binomial(link = "logit"), weights = trials * weights5)
cat("Coefficients:\n")
print(model5$coefficients)
cat("Fitted values:\n")
print(model5$fitted.values)

# Test 6: Poisson with zero counts and weights
cat("\n=== Test 6: Poisson with zero counts and weights ===\n")
counts <- c(0, 1, 0, 2, 0)
x6 <- c(1, 2, 3, 4, 5)
weights6 <- c(1, 1, 0, 1, 1)

model6 <- glm(counts ~ x6, family = poisson(link = "log"), weights = weights6)
cat("Coefficients:\n")
print(model6$coefficients)
cat("Fitted values:\n")
print(model6$fitted.values)

# Test 7: Perfect separation in binomial
cat("\n=== Test 7: Perfect separation in binomial ===\n")
successes7 <- c(0, 0, 0, 10, 10)
trials7 <- c(10, 10, 10, 10, 10)
x7 <- c(1, 2, 3, 4, 5)
y7 <- successes7 / trials7
weights7 <- c(1, 1, 1, 1, 1)

tryCatch({
  model7 <- glm(y7 ~ x7, family = binomial(link = "logit"), weights = trials7)
  cat("Coefficients:\n")
  print(model7$coefficients)
  cat("Fitted values:\n")
  print(model7$fitted.values)
  cat("Converged:", model7$converged, "\n")
}, error = function(e) {
  cat("Error with perfect separation:", e$message, "\n")
})

# Test 8: Identical x values with different weights
cat("\n=== Test 8: Identical x values with different weights ===\n")
x8 <- c(1, 1, 1, 1, 1)  # All x values identical
y8 <- c(2.1, 4.2, 5.8, 8.1, 10.3)
weights8 <- c(1, 2, 3, 4, 5)

model8 <- glm(y8 ~ x8, family = gaussian(link = "identity"), weights = weights8)
cat("Coefficients:\n")
print(model8$coefficients)
cat("Fitted values:\n")
print(model8$fitted.values)

# Test 9: All weights zero
cat("\n=== Test 9: All weights zero ===\n")
weights9 <- c(0, 0, 0, 0, 0)

tryCatch({
  model9 <- glm(y ~ x, family = gaussian(link = "identity"), weights = weights9)
  cat("Coefficients:\n")
  print(model9$coefficients)
}, error = function(e) {
  cat("Error with all zero weights:", e$message, "\n")
})

# Test 10: Weights with NaN values
cat("\n=== Test 10: Weights with NaN values ===\n")
weights10 <- c(1, 2, NaN, 4, 5)

tryCatch({
  model10 <- glm(y ~ x, family = gaussian(link = "identity"), weights = weights10)
  cat("Coefficients:\n")
  print(model10$coefficients)
}, error = function(e) {
  cat("Error with NaN weights:", e$message, "\n")
})

# Test 11: Weights with Infinity values
cat("\n=== Test 11: Weights with Infinity values ===\n")
weights11 <- c(1, 2, Inf, 4, 5)

tryCatch({
  model11 <- glm(y ~ x, family = gaussian(link = "identity"), weights = weights11)
  cat("Coefficients:\n")
  print(model11$coefficients)
}, error = function(e) {
  cat("Error with Inf weights:", e$message, "\n")
})

# Test 12: Single observation
cat("\n=== Test 12: Single observation ===\n")
x12 <- c(1)
y12 <- c(2.1)
weights12 <- c(1)

model12 <- glm(y12 ~ x12, family = gaussian(link = "identity"), weights = weights12)
cat("Coefficients:\n")
print(model12$coefficients)
cat("Fitted values:\n")
print(model12$fitted.values)

# Test 13: Gamma GLM with weights
cat("\n=== Test 13: Gamma GLM with weights ===\n")
x13 <- c(1, 2, 3, 4, 5)
y13 <- c(1.1, 2.2, 3.3, 4.4, 5.5)  # Positive values for Gamma
weights13 <- c(1, 2, 1, 2, 1)

model13 <- glm(y13 ~ x13, family = Gamma(link = "inverse"), weights = weights13)
cat("Coefficients:\n")
print(model13$coefficients)
cat("Fitted values:\n")
print(model13$fitted.values)

# Test 14: Inverse Gaussian with weights
cat("\n=== Test 14: Inverse Gaussian with weights ===\n")
x14 <- c(1, 2, 3, 4, 5)
y14 <- c(1.1, 2.2, 3.3, 4.4, 5.5)  # Positive values for Inverse Gaussian
weights14 <- c(1, 2, 1, 2, 1)

model14 <- glm(y14 ~ x14, family = inverse.gaussian(link = "inverse"), weights = weights14)
cat("Coefficients:\n")
print(model14$coefficients)
cat("Fitted values:\n")
print(model14$fitted.values)

# Test 15: Weights length mismatch
cat("\n=== Test 15: Weights length mismatch ===\n")
weights15 <- c(1, 2, 3)  # Wrong length

tryCatch({
  model15 <- glm(y ~ x, family = gaussian(link = "identity"), weights = weights15)
  cat("Coefficients:\n")
  print(model15$coefficients)
}, error = function(e) {
  cat("Error with length mismatch:", e$message, "\n")
})
