# Companion to glm.test.ts — Poisson offset convergence, Gamma AIC/logLik.
# Usage (from glm dir): Rscript r-source-tests/glm-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "..", "source-tests", "r-json-emit.R"))

# ── L1-7: Poisson GLM with offset where null deviance fails to converge ──
Y <- c(rep(0, 35), 1, 2, 0, 6, 8, 16, 43)
beta <- 42:1
cst <- lchoose(42, beta)
tau <- (beta^2) / 2
suppressWarnings(
  fit <- glm(formula = Y ~ offset(cst) + beta + tau, family = poisson)
)

# ── L55-80: Gamma GLM — AIC/logLik consistency (clotting data) ──
clotting <- data.frame(
  u    = c(5, 10, 15, 20, 30, 40, 60, 80, 100),
  lot1 = c(118, 58, 42, 35, 27, 25, 21, 19, 18),
  lot2 = c(69, 35, 26, 21, 18, 16, 13, 12, 12)
)
fm1 <- glm(lot1 ~ log(u), data = clotting, family = Gamma)
fm2 <- glm(lot2 ~ log(u), data = clotting, family = Gamma)

s1 <- summary(fm1)
s2 <- summary(fm2)
ll1 <- logLik(fm1)
ll2 <- logLik(fm2)

result <- list(
  # Poisson offset model
  poisson_coef = as.vector(coef(fit)),
  poisson_deviance = fit$deviance,
  poisson_null_deviance = fit$null.deviance,
  poisson_aic = fit$aic,
  poisson_converged = fit$converged,

  # Gamma lot1 model
  gamma1_coef = as.vector(coef(fm1)),
  gamma1_se = as.vector(s1$coefficients[, "Std. Error"]),
  gamma1_deviance = fm1$deviance,
  gamma1_null_deviance = fm1$null.deviance,
  gamma1_aic = fm1$aic,
  gamma1_loglik = as.vector(ll1),
  gamma1_df = attr(ll1, "df"),
  gamma1_dispersion = s1$dispersion,
  gamma1_fitted = as.vector(fitted(fm1)),
  gamma1_residuals_deviance = as.vector(residuals(fm1, type = "deviance")),
  gamma1_residuals_pearson = as.vector(residuals(fm1, type = "pearson")),

  # Gamma lot2 model
  gamma2_coef = as.vector(coef(fm2)),
  gamma2_se = as.vector(s2$coefficients[, "Std. Error"]),
  gamma2_deviance = fm2$deviance,
  gamma2_null_deviance = fm2$null.deviance,
  gamma2_aic = fm2$aic,
  gamma2_loglik = as.vector(ll2),
  gamma2_df = attr(ll2, "df"),
  gamma2_dispersion = s2$dispersion,
  gamma2_fitted = as.vector(fitted(fm2)),
  gamma2_residuals_deviance = as.vector(residuals(fm2, type = "deviance")),
  gamma2_residuals_pearson = as.vector(residuals(fm2, type = "pearson"))
)
emit_reference(result)
