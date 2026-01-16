data <- data.frame(
  y = c(5, 7, 9, 11, 13),
  x = c(1, 2, 3, 4, 5)
)

model <- glm(y ~ x, family = gaussian(link = "identity"), data = data)

# Check raw deviance calculation
y_values <- data$y
fitted_values <- fitted(model)
residuals_values <- y_values - fitted_values
squared_resid <- residuals_values^2

cat("y:", y_values, "\n")
cat("fitted:", fitted_values, "\n")
cat("residuals:", residuals_values, "\n")
cat("squared residuals:", squared_resid, "\n")
cat("sum(squared residuals):", sum(squared_resid), "\n")
cat("deviance(model):", deviance(model), "\n")

# Show precision
options(digits=20)
cat("\nWith full precision:\n")
cat("deviance(model):", deviance(model), "\n")
cat("sum(squared residuals):", sum(squared_resid), "\n")
