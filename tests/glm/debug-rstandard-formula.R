data <- data.frame(
  y = c(5, 7, 9, 11, 13),
  x = c(1, 2, 3, 4, 5)
)

model <- glm(y ~ x, family = gaussian(link = "identity"), data = data)

# Get components
res_dev <- residuals(model, type = "deviance")
res_pear <- residuals(model, type = "pearson")
hat <- hatvalues(model)
phi <- summary(model)$dispersion

cat("Deviance residuals:", res_dev, "\n")
cat("Pearson residuals:", res_pear, "\n")
cat("Hat values:", hat, "\n")
cat("Dispersion (phi):", phi, "\n\n")

# Manual calculation of rstandard
cat("=== Manual rstandard calculation ===\n")
for (i in 1:length(res_dev)) {
  # Formula: r_i / sqrt(phi * (1 - h_i))
  manual <- res_dev[i] / sqrt(phi * (1 - hat[i]))
  r_result <- rstandard(model, type = "deviance")[i]
  cat(sprintf("Obs %d: manual=%.6f, R=%.6f\n", i, manual, r_result))
}

# Try with Pearson residuals
cat("\n=== Try with Pearson residuals ===\n")
for (i in 1:length(res_pear)) {
  manual <- res_pear[i] / sqrt(phi * (1 - hat[i]))
  r_result_pear <- rstandard(model, type = "pearson")[i]
  cat(sprintf("Obs %d: manual=%.6f, R pearson=%.6f\n", i, manual, r_result_pear))
}
