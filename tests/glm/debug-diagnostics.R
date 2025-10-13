data <- data.frame(
  y = c(5, 7, 9, 11, 13),
  x = c(1, 2, 3, 4, 5)
)

model <- glm(y ~ x, family = gaussian(link = "identity"), data = data)
summary_model <- summary(model)

cat("\n=== Debug Info (R) ===\n")
cat("Dispersion parameter:", summary_model$dispersion, "\n")
cat("Residual deviance:", deviance(model), "\n")
cat("DF residual:", df.residual(model), "\n")

cat("\nDeviance residuals:", residuals(model, type = "deviance"), "\n")
cat("Leverage values:", hatvalues(model), "\n")

cat("\n=== Results (R) ===\n")
cat("Residuals:", residuals(model, type = "deviance"), "\n")
cat("Rstandard:", rstandard(model, type = "deviance"), "\n")
cat("Rstudent:", rstudent(model), "\n")
