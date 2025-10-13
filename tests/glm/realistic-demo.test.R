#!/usr/bin/env Rscript
# GLM API Validation - R Reference Implementation
#
# This file contains the equivalent R tests to validate that our TypeScript/Rust
# implementation produces the same results as R's glm() function.

cat("\n=== GLM Demo 1: Logistic Regression ===\n\n")

data1 <- data.frame(
  y = c(0, 1, 0, 1, 1, 0),
  x1 = c(1.2, 2.5, 1.8, 3.2, 2.9, 1.5),
  x2 = c(3, 5, 2, 7, 6, 3)
)

model1 <- glm(y ~ x1 + x2, family = binomial(link = "logit"), data = data1)
summary1 <- summary(model1)

cat("Coefficients:", names(coef(model1)), "\n")
cat("Estimates:", sprintf("%.3f", coef(model1)), "\n")
cat("AIC:", sprintf("%.2f", AIC(model1)), "\n")

cat("\n=== GLM Demo 2: Linear Regression ===\n\n")

data2 <- data.frame(
  price = c(200, 250, 180, 300, 220),
  sqft = c(1200, 1500, 1000, 1800, 1300),
  beds = c(2, 3, 2, 4, 3)
)

model2 <- glm(price ~ sqft + beds, family = gaussian(link = "identity"), data = data2)
summary2 <- summary(model2)

cat("Coefficients:\n")
coef_names <- names(coef(model2))
coef_vals <- coef(model2)
for (i in seq_along(coef_names)) {
  cat(sprintf("  %s: %.3f\n", coef_names[i], coef_vals[i]))
}

cat("\n=== GLM Demo 3: Predictions ===\n\n")

data3 <- data.frame(
  y = c(5, 7, 9, 11),
  x = c(1, 2, 3, 4)
)

model3 <- glm(y ~ x, family = gaussian(link = "identity"), data = data3)

newdata3 <- data.frame(x = c(5, 6))
predictions <- predict(model3, newdata = newdata3, type = "response")
cat("Predictions:", sprintf("%.2f", predictions), "\n")

cat("\n=== GLM Demo 4: Confidence Intervals ===\n\n")

data4 <- data.frame(
  y = c(0, 1, 0, 1, 1),
  x = c(1, 2, 1.5, 2.5, 3)
)

model4 <- glm(y ~ x, family = binomial(link = "logit"), data = data4)
ci <- confint.default(model4, level = 0.95)

cat("95% Confidence Intervals:\n")
cat("Lower:", sprintf("%.2f", ci[, 1]), "\n")
cat("Upper:", sprintf("%.2f", ci[, 2]), "\n")

cat("\n=== GLM Demo 5: Residual Diagnostics ===\n\n")

data5 <- data.frame(
  y = c(5, 7, 9, 11, 13),
  x = c(1, 2, 3, 4, 5)
)

model5 <- glm(y ~ x, family = gaussian(link = "identity"), data = data5)

residuals_dev <- residuals(model5, type = "deviance")
rstandard_vals <- rstandard(model5, type = "deviance")
rstudent_vals <- rstudent(model5)

cat("Residuals:", sprintf("%.3f", residuals_dev), "\n")
cat("Standardized:", sprintf("%.3f", rstandard_vals), "\n")
cat("Studentized:", sprintf("%.3f", rstudent_vals), "\n")

cat("\n=== GLM Demo 6: Influence Measures ===\n\n")

data6 <- data.frame(
  y = c(0, 1, 0, 1, 1),
  x = c(1, 2, 1.5, 2.5, 3)
)

model6 <- glm(y ~ x, family = binomial(link = "logit"), data = data6)

hat_vals <- hatvalues(model6)
cooks_d <- cooks.distance(model6)
infl <- influence.measures(model6)
dffits_vals <- dffits(model6)
covratio_vals <- covratio(model6)

format_value <- function(x) {
  if (is.na(x) || is.nan(x)) {
    "NaN"
  } else {
    sprintf("%.3f", x)
  }
}

cat("Hat values:", sapply(hat_vals, format_value), "\n")
cat("Cook's D:", sapply(cooks_d, format_value), "\n")
cat("DFFITS:", sapply(dffits_vals, format_value), "\n")
cat("Covratio:", sapply(covratio_vals, format_value), "\n")

cat("\n=== GLM Demo 7: Weighted Regression ===\n\n")

data7 <- data.frame(
  y = c(10.2, 10.5, 11.8, 12.1),
  x = c(1, 2, 3, 4)
)

weights7 <- c(100, 50, 10, 80)

model7 <- glm(y ~ x, family = gaussian(link = "identity"), data = data7, weights = weights7)
summary7 <- summary(model7)

cat("Weighted coefficients:\n")
coef_names7 <- names(coef(model7))
coef_vals7 <- coef(model7)
for (i in seq_along(coef_names7)) {
  cat(sprintf("  %s: %.3f\n", coef_names7[i], coef_vals7[i]))
}

cat("\n=== GLM Demo 8: Variance-Covariance Matrix ===\n\n")

data8 <- data.frame(
  y = c(5, 7, 9, 11),
  x = c(1, 2, 3, 4)
)

model8 <- glm(y ~ x, family = gaussian(link = "identity"), data = data8)
vcov_matrix <- vcov(model8)

cat("Variance-Covariance Matrix:\n")
for (i in 1:nrow(vcov_matrix)) {
  cat("  ", sprintf("%.6f", vcov_matrix[i, ]), "\n")
}

cat("\n=== All R GLM Demos Complete ===\n")
