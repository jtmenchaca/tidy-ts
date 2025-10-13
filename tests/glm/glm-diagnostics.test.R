#!/usr/bin/env Rscript

# Test leverage (hat values) and Cook's distance for GLM

# Test 1: Simple Gaussian GLM
cat("\n=== Test 1: Gaussian GLM ===\n")
x <- c(1, 2, 3, 4, 5)
y <- c(2, 4, 6, 8, 10)
model1 <- glm(y ~ x, family = gaussian())

cat("Leverage (hat values):\n")
print(hatvalues(model1))

cat("\nCook's distance:\n")
print(cooks.distance(model1))

# Test 2: Weighted Gaussian GLM
cat("\n\n=== Test 2: Weighted Gaussian GLM ===\n")
x2 <- c(1, 2, 3, 4, 5)
y2 <- c(2.1, 4.2, 5.8, 8.1, 10.3)
weights2 <- c(1, 1, 2, 2, 1)
model2 <- glm(y2 ~ x2, family = gaussian(), weights = weights2)

cat("Leverage (hat values):\n")
print(hatvalues(model2))

cat("\nCook's distance:\n")
print(cooks.distance(model2))

# Test 3: Binomial GLM
cat("\n\n=== Test 3: Binomial GLM ===\n")
x3 <- c(1, 2, 3, 4, 5)
successes <- c(1, 2, 3, 4, 5)
trials <- c(10, 10, 10, 10, 10)
y3 <- successes / trials
model3 <- glm(y3 ~ x3, family = binomial(), weights = trials)

cat("Leverage (hat values):\n")
print(hatvalues(model3))

cat("\nCook's distance:\n")
print(cooks.distance(model3))

# Test 4: Poisson GLM
cat("\n\n=== Test 4: Poisson GLM ===\n")
x4 <- c(1, 2, 3, 4, 5)
y4 <- c(2, 5, 8, 12, 18)
model4 <- glm(y4 ~ x4, family = poisson())

cat("Leverage (hat values):\n")
print(hatvalues(model4))

cat("\nCook's distance:\n")
print(cooks.distance(model4))

# Test 5: GLM with outlier (high Cook's distance)
cat("\n\n=== Test 5: GLM with Outlier ===\n")
x5 <- c(1, 2, 3, 4, 5, 6)
y5 <- c(2, 4, 6, 8, 10, 100)  # Last point is an outlier
model5 <- glm(y5 ~ x5, family = gaussian())

cat("Leverage (hat values):\n")
print(hatvalues(model5))

cat("\nCook's distance:\n")
print(cooks.distance(model5))
cat("Note: Last observation should have high Cook's distance\n")
