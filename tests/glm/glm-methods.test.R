#!/usr/bin/env Rscript

# Test summary(), rstandard(), rstudent(), and influence() methods
# These tests validate TypeScript implementations against R

cat("=== GLM Additional Methods Tests ===\n\n")

# Test 1: Binomial GLM - summary
cat("Test 1: Binomial GLM - summary\n")
model1 <- glm(vs ~ mpg + wt, data = mtcars, family = binomial())
s1 <- summary(model1)
cat("Coefficients table:\n")
print(s1$coefficients)
cat("\nDispersion:", s1$dispersion, "\n")
cat("Null deviance:", s1$null.deviance, "\n")
cat("Residual deviance:", s1$deviance, "\n")
cat("AIC:", s1$aic, "\n\n")

# Test 2: Gaussian GLM - summary (uses t-test instead of z-test)
cat("Test 2: Gaussian GLM - summary\n")
model2 <- glm(mpg ~ wt + hp, data = mtcars, family = gaussian())
s2 <- summary(model2)
cat("Coefficients table:\n")
print(s2$coefficients)
cat("\nDispersion:", s2$dispersion, "\n\n")

# Test 3: rstandard - deviance type
cat("Test 3: rstandard - deviance type\n")
model3 <- glm(vs ~ mpg + wt, data = mtcars, family = binomial())
rs_dev <- rstandard(model3, type = "deviance")
cat("First 5 rstandard (deviance):\n")
print(head(rs_dev, 5))
cat("\n")

# Test 4: rstandard - pearson type
cat("Test 4: rstandard - pearson type\n")
rs_pear <- rstandard(model3, type = "pearson")
cat("First 5 rstandard (pearson):\n")
print(head(rs_pear, 5))
cat("\n")

# Test 5: rstudent
cat("Test 5: rstudent\n")
rst <- rstudent(model3)
cat("First 5 rstudent:\n")
print(head(rst, 5))
cat("\n")

# Test 6: influence measures
cat("Test 6: influence measures\n")
infl <- influence.measures(model3)
cat("First 5 rows:\n")
print(head(infl$infmat, 5))
cat("\n")

# Test 7: Individual influence components
cat("Test 7: Individual influence components\n")
inf_full <- influence(model3)
cat("First 5 dffits:\n")
print(head(dffits(model3), 5))
cat("\nFirst 5 covratio:\n")
print(head(covratio(model3), 5))
cat("\n")

# Test 8: Poisson GLM
cat("Test 8: Poisson GLM - summary and diagnostics\n")
model8 <- glm(carb ~ wt + hp, data = mtcars, family = poisson())
s8 <- summary(model8)
cat("Coefficients:\n")
print(s8$coefficients)
cat("\nrstandard (first 5):\n")
print(head(rstandard(model8), 5))
cat("\nrstudent (first 5):\n")
print(head(rstudent(model8), 5))
cat("\n")

cat("=== All Tests Complete ===\n")
