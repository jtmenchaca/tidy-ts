# Companion to ig-glm.test.ts — inverse Gaussian GLM (Whitmore 1986 data).
# Usage (from glm dir): Rscript r-source-tests/ig-glm-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "..", "source-tests", "r-json-emit.R"))

# ── Whitmore (1986) data: projected vs actual sales ──
x <- c(5959, 3534, 2641, 1965, 1738, 1182, 667, 613, 610, 549,
       527, 353, 331, 290, 253, 193, 156, 133, 122, 114)
y <- c(5673, 3659, 2565, 2182, 1839, 1236, 918, 902, 756, 500,
       487, 463, 225, 257, 311, 212, 166, 123, 198, 99)

# ── L21-29: identity link ──
fit <- glm(y ~ x - 1, weights = x^2,
           family = inverse.gaussian(link = "identity"),
           epsilon = 1e-12)
s1 <- coef(summary(fit))
beta_exact <- sum(y) / sum(x)

# ── L35-37: asymptotic CI via normality ──
sterr <- s1[, "Std. Error"]
ci_asymp <- as.vector(coef(fit)) + 1.96 * as.vector(sterr) * c(-1, 1)

# ── L41-44: inverse link ──
fit2 <- glm(y ~ I(1/x) - 1, weights = x^2,
            family = inverse.gaussian(link = "inverse"),
            epsilon = 1e-12)
s2 <- coef(summary(fit2))

# profile-likelihood CI via MASS::confint
have_MASS <- requireNamespace("MASS", quietly = TRUE)
ci_profile <- if (have_MASS) as.vector(confint(fit, 1, level = 0.95)) else c(NA, NA)
ci_profile2 <- if (have_MASS) as.vector(rev(1 / confint(fit2, 1, level = 0.95))) else c(NA, NA)

result <- list(
  # identity link model
  fit1_coef = as.vector(coef(fit)),
  fit1_se = as.vector(s1[, "Std. Error"]),
  fit1_tvalue = as.vector(s1[, "t value"]),
  fit1_deviance = fit$deviance,
  fit1_aic = fit$aic,
  fit1_fitted = as.vector(fitted(fit)),
  fit1_residuals_deviance = as.vector(residuals(fit, type = "deviance")),
  fit1_residuals_pearson = as.vector(residuals(fit, type = "pearson")),
  beta_exact = beta_exact,
  ci_asymp = ci_asymp,
  ci_profile = ci_profile,

  # inverse link model
  fit2_coef = as.vector(coef(fit2)),
  fit2_se = as.vector(s2[, "Std. Error"]),
  fit2_tvalue = as.vector(s2[, "t value"]),
  fit2_deviance = fit2$deviance,
  fit2_aic = fit2$aic,
  fit2_fitted = as.vector(fitted(fit2)),
  ci_profile2 = ci_profile2
)
emit_reference(result)
