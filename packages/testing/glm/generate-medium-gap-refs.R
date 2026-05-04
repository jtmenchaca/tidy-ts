#!/usr/bin/env Rscript
# Generate reference values for medium-priority GLM test gaps:
# 1. Gamma residuals / vcov / influence
# 2. Inverse Gaussian predictions on new data
# 3. Cauchit link (binomial)
# 4. Offset + weights combined

library(jsonlite)

set.seed(42)
results <- list()

# ═══════════════════════════════════════════════════════════════════════
# 1. GAMMA: residuals, vcov, influence (log link, n=15)
# ═══════════════════════════════════════════════════════════════════════
cat("=== Gamma residuals/vcov/influence ===\n")
n <- 15
x <- runif(n, 0.5, 3)
mu <- exp(0.5 + 0.6 * x)
y <- rgamma(n, shape = 5, rate = 5 / mu)
df_gamma <- data.frame(y = y, x = x)
fit_gamma <- glm(y ~ x, family = Gamma(link = "log"), data = df_gamma)
s_gamma <- summary(fit_gamma)

results$gamma_diagnostics <- list(
  x = x,
  y = y,
  coef = unname(coef(fit_gamma)),
  se = unname(s_gamma$coefficients[, 2]),
  deviance = fit_gamma$deviance,
  aic = fit_gamma$aic,
  dispersion = s_gamma$dispersion,
  # Residuals
  residuals_deviance = unname(residuals(fit_gamma, type = "deviance")),
  residuals_pearson = unname(residuals(fit_gamma, type = "pearson")),
  residuals_working = unname(residuals(fit_gamma, type = "working")),
  residuals_response = unname(residuals(fit_gamma, type = "response")),
  # vcov matrix
  vcov = unname(vcov(fit_gamma)),
  # Influence
  leverage = unname(hatvalues(fit_gamma)),
  cooks_distance = unname(cooks.distance(fit_gamma)),
  rstandard_deviance = unname(rstandard(fit_gamma, type = "deviance")),
  rstandard_pearson = unname(rstandard(fit_gamma, type = "pearson")),
  # Fitted values
  fitted = unname(fitted(fit_gamma))
)
cat("coef:", results$gamma_diagnostics$coef, "\n")

# ═══════════════════════════════════════════════════════════════════════
# 2. INVERSE GAUSSIAN: predictions on new data (canonical link)
# ═══════════════════════════════════════════════════════════════════════
cat("\n=== InvGauss predictions ===\n")
n <- 20
x_ig <- rnorm(n, mean = 2, sd = 0.5)
mu_ig <- 1 / (0.5 + 0.1 * x_ig)^2  # canonical link: 1/mu^2
y_ig <- abs(rnorm(n, mean = mu_ig, sd = mu_ig * 0.1))
y_ig <- pmax(y_ig, 0.01)
df_ig <- data.frame(y = y_ig, x = x_ig)
fit_ig <- glm(y ~ x, family = inverse.gaussian(), data = df_ig)

# New data for prediction
newx <- c(1.0, 1.5, 2.0, 2.5, 3.0)
newdf <- data.frame(x = newx)
pred_response <- unname(predict(fit_ig, newdata = newdf, type = "response"))
pred_link <- unname(predict(fit_ig, newdata = newdf, type = "link"))

results$invgauss_predict <- list(
  x = x_ig,
  y = y_ig,
  coef = unname(coef(fit_ig)),
  se = unname(summary(fit_ig)$coefficients[, 2]),
  deviance = fit_ig$deviance,
  aic = fit_ig$aic,
  newx = newx,
  pred_response = pred_response,
  pred_link = pred_link,
  fitted5 = unname(fitted(fit_ig)[1:5])
)
cat("coef:", results$invgauss_predict$coef, "\n")
cat("pred_response:", pred_response, "\n")

# ═══════════════════════════════════════════════════════════════════════
# 3. BINOMIAL CAUCHIT LINK
# ═══════════════════════════════════════════════════════════════════════
cat("\n=== Binomial cauchit ===\n")
n <- 40
x_bc <- rnorm(n)
p_bc <- pcauchy(0.2 + 0.8 * x_bc)
y_bc <- rbinom(n, 1, p_bc)
df_bc <- data.frame(y = y_bc, x = x_bc)
fit_bc <- glm(y ~ x, family = binomial(link = "cauchit"), data = df_bc)
s_bc <- summary(fit_bc)

results$binomial_cauchit <- list(
  x = x_bc,
  y = y_bc,
  coef = unname(coef(fit_bc)),
  se = unname(s_bc$coefficients[, 2]),
  deviance = fit_bc$deviance,
  null_deviance = fit_bc$null.deviance,
  aic = fit_bc$aic,
  fitted5 = unname(fitted(fit_bc)[1:5]),
  confint_lower = unname(confint.default(fit_bc)[, 1]),
  confint_upper = unname(confint.default(fit_bc)[, 2])
)
cat("coef:", results$binomial_cauchit$coef, "\n")

# ═══════════════════════════════════════════════════════════════════════
# 4. OFFSET + WEIGHTS COMBINED (Poisson with offset and weights)
# ═══════════════════════════════════════════════════════════════════════
cat("\n=== Offset + weights combined ===\n")
n <- 25
x_ow <- rnorm(n, mean = 1, sd = 0.5)
offset_ow <- log(runif(n, 1, 5))  # log(exposure)
weights_ow <- runif(n, 0.5, 2.0)
mu_ow <- exp(0.3 + 0.5 * x_ow + offset_ow)
y_ow <- rpois(n, lambda = mu_ow)
df_ow <- data.frame(y = y_ow, x = x_ow)

fit_ow <- glm(y ~ x + offset(offset_ow), family = poisson(), data = df_ow,
              weights = weights_ow)
s_ow <- summary(fit_ow)

results$offset_weights <- list(
  x = x_ow,
  y = as.numeric(y_ow),  # ensure numeric, not integer
  offset = offset_ow,
  weights = weights_ow,
  coef = unname(coef(fit_ow)),
  se = unname(s_ow$coefficients[, 2]),
  deviance = fit_ow$deviance,
  null_deviance = fit_ow$null.deviance,
  aic = fit_ow$aic,
  fitted5 = unname(fitted(fit_ow)[1:5])
)
cat("coef:", results$offset_weights$coef, "\n")
cat("SE:", results$offset_weights$se, "\n")

# ═══════════════════════════════════════════════════════════════════════
# 5. GAMMA: predictions on new data (log link)
# ═══════════════════════════════════════════════════════════════════════
cat("\n=== Gamma predictions ===\n")
# Reuse the gamma diagnostics data
newx_g <- c(0.5, 1.0, 1.5, 2.0, 2.5)
newdf_g <- data.frame(x = newx_g)
pred_gamma_resp <- unname(predict(fit_gamma, newdata = newdf_g, type = "response"))
pred_gamma_link <- unname(predict(fit_gamma, newdata = newdf_g, type = "link"))

results$gamma_predict <- list(
  x = x,
  y = y,
  coef = unname(coef(fit_gamma)),
  newx = newx_g,
  pred_response = pred_gamma_resp,
  pred_link = pred_gamma_link
)
cat("pred_response:", pred_gamma_resp, "\n")

# ═══════════════════════════════════════════════════════════════════════
# Write out
# ═══════════════════════════════════════════════════════════════════════
write_json(results, "packages/testing/glm/medium-gap-refs.json",
  digits = 17, pretty = FALSE, auto_unbox = TRUE)
cat("\nWrote medium-gap-refs.json\n")
