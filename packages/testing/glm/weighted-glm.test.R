# Test weighted GLM to validate against R's implementation
# This test uses different weight patterns to ensure our implementation matches R exactly

# Test 1: Gaussian GLM with weights
cat("\n=== Test 1: Gaussian GLM with weights ===\n")
x <- c(1, 2, 3, 4, 5)
y <- c(2.1, 4.2, 5.8, 8.1, 10.3)
weights <- c(1, 1, 2, 2, 1)

model <- glm(y ~ x, family = gaussian(link = "identity"), weights = weights)

cat("Coefficients:\n")
print(model$coefficients)
cat("\nFitted values:\n")
print(model$fitted.values)
cat("\nResiduals:\n")
print(model$residuals)
cat("\nDeviance:", model$deviance, "\n")
cat("AIC:", model$aic, "\n")
cat("Null deviance:", model$null.deviance, "\n")

# Test 2: Binomial GLM with weights (aggregated data)
cat("\n=== Test 2: Binomial GLM with weights (aggregated data) ===\n")
# Simulating aggregated binomial data
# weights represent the number of trials
successes <- c(8, 12, 15, 18, 20)
trials <- c(10, 15, 20, 25, 30)
x2 <- c(1, 2, 3, 4, 5)
y2 <- successes / trials  # proportion of successes

model2 <- glm(y2 ~ x2, family = binomial(link = "logit"), weights = trials)

cat("Coefficients:\n")
print(model2$coefficients)
cat("\nFitted values:\n")
print(model2$fitted.values)
cat("\nDeviance:", model2$deviance, "\n")
cat("AIC:", model2$aic, "\n")

# Test 3: Poisson GLM with weights (exposure/offset alternative)
cat("\n=== Test 3: Poisson GLM with weights ===\n")
counts <- c(5, 8, 12, 15, 20)
x3 <- c(1, 2, 3, 4, 5)
weights3 <- c(1, 1.5, 1, 2, 1.2)

model3 <- glm(counts ~ x3, family = poisson(link = "log"), weights = weights3)

cat("Coefficients:\n")
print(model3$coefficients)
cat("\nFitted values:\n")
print(model3$fitted.values)
cat("\nDeviance:", model3$deviance, "\n")
cat("AIC:", model3$aic, "\n")

# Test 4: Weights with zero values (should exclude those observations)
cat("\n=== Test 4: Gaussian GLM with zero weights ===\n")
x4 <- c(1, 2, 3, 4, 5)
y4 <- c(2, 4, 6, 8, 10)
weights4 <- c(1, 1, 0, 1, 1)  # Zero weight for third observation

model4 <- glm(y4 ~ x4, family = gaussian(link = "identity"), weights = weights4)

cat("Coefficients:\n")
print(model4$coefficients)
cat("\nFitted values:\n")
print(model4$fitted.values)
cat("\nNote: Observation with zero weight should be effectively excluded\n")

# Test 5: Uniform weights (should match unweighted)
cat("\n=== Test 5: Uniform weights (should match unweighted) ===\n")
model5_weighted <- glm(y ~ x, family = gaussian(link = "identity"), weights = rep(1, 5))
model5_unweighted <- glm(y ~ x, family = gaussian(link = "identity"))

cat("Weighted coefficients:\n")
print(model5_weighted$coefficients)
cat("\nUnweighted coefficients:\n")
print(model5_unweighted$coefficients)
cat("\nDifference (should be near zero):\n")
print(model5_weighted$coefficients - model5_unweighted$coefficients)
