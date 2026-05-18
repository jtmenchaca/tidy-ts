groupA <- c(12.3, 15.7, 18.2, 14.8, 16.1, 13.9)
groupB <- c(22.1, 25.4, 28.6, 24.3, 26.8, 23.7)
y <- c(groupA, groupB)
group <- factor(rep(c("A", "B"), each = 6))
group <- relevel(group, ref = "B")  # Make B the reference level

ttest <- t.test(groupA, groupB, var.equal = FALSE)

model <- glm(y ~ group, family = gaussian)
coefs <- summary(model)$coefficients
model_summary <- summary(model)

# Extract all the values we need
meanA <- ttest$estimate[[1]]
meanB <- ttest$estimate[[2]]
t_val <- as.numeric(ttest$statistic)
p_val <- ttest$p.value

t_glm <- coefs["groupA", "t value"]
p_glm <- coefs["groupA", "Pr(>|t|)"]
coef_diff <- coefs["groupA", "Estimate"]
intercept <- coefs["(Intercept)", "Estimate"]

# Extract standard errors
std_errors <- coefs[, "Std. Error"]

# Extract model information
deviance <- model$deviance
aic <- AIC(model)
null_deviance <- model$null.deviance
df_residual <- model$df.residual
df_null <- model$df.null
rank <- model$rank
iter <- model$iter
converged <- model$converged

# Extract diagnostic statistics
# Note: summary(glm()) doesn't populate r.squared/adj.r.squared/fstatistic for
# the gaussian family — those live on summary(lm()). For a gaussian/identity GLM
# the LM and GLM fits are identical, so we use lm() here as the canonical source.
lm_fit <- lm(y ~ group)
lm_summary <- summary(lm_fit)
r_squared <- lm_summary$r.squared
adj_r_squared <- lm_summary$adj.r.squared
f_statistic <- lm_summary$fstatistic[1]
f_p_value <- pf(lm_summary$fstatistic[1], lm_summary$fstatistic[2], lm_summary$fstatistic[3], lower.tail = FALSE)
residual_standard_error <- lm_summary$sigma
n_observations <- length(y)
dispersion_parameter <- model_summary$dispersion

# Extract covariance matrix
cov_matrix <- vcov(model)

# Extract QR decomposition
qr_info <- model$qr
qr_rank <- qr_info$rank
qr_qraux <- qr_info$qraux
qr_pivot <- qr_info$pivot
qr_tol <- qr_info$tol

# Extract R matrix
r_matrix <- model$R

# Extract model matrix info
model_matrix <- model.matrix(model)
model_matrix_dim <- dim(model_matrix)
model_matrix_colnames <- colnames(model_matrix)

# Extract family and link info
family_name <- model$family$family
link_name <- model$family$link

# Extract call and formula
model_call <- deparse(model$call)
model_formula <- deparse(model$formula)

cat("=== R GLM RESULT ===\n")
cat(sprintf("Coefficients: [%.4f, %.4f]\n", intercept, coef_diff))
cat(sprintf("Standard errors: [%.4f, %.4f]\n", std_errors[1], std_errors[2]))
cat(sprintf("T-statistics: [%.4f, %.4f]\n", coefs[1,3], coefs[2,3]))
cat(sprintf("P-values: [%.5f, %.5f]\n", coefs[1,4], coefs[2,4]))
cat(sprintf("Deviance: %.4f | AIC: %.4f\n", deviance, aic))
cat(sprintf("Null deviance: %.4f | Residual df: %d\n", null_deviance, df_residual))
cat(sprintf("Rank: %d | Iterations: %d | Converged: %s\n", rank, iter, converged))
cat(sprintf("R-squared: %.15g | Adj R-squared: %.15g\n", r_squared, adj_r_squared))
cat(sprintf("F-statistic: %.15g | F p-value: %.15g\n", f_statistic, f_p_value))
cat(sprintf("Residual SE: %.15g | Dispersion: %.15g | n: %d\n", residual_standard_error, dispersion_parameter, n_observations))
cat(sprintf("Family: %s | Link: %s\n", family_name, link_name))
cat("Covariance matrix:\n")
for (i in 1:nrow(cov_matrix)) {
  cat(sprintf("  [%.4f, %.4f]\n", cov_matrix[i,1], cov_matrix[i,2]))
}
cat("R matrix:\n")
for (i in 1:nrow(r_matrix)) {
  cat(sprintf("  [%.4f, %.4f]\n", r_matrix[i,1], r_matrix[i,2]))
}
cat(sprintf("Model matrix: %dx%d, cols: [%s]\n", model_matrix_dim[1], model_matrix_dim[2], paste(model_matrix_colnames, collapse = ", ")))
cat("=== END R GLM ===\n")