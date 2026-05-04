#!/usr/bin/env Rscript
# Generate reference values for GLM family coverage gaps:
# 1. Quasipoisson (canonical log link)
# 2. Gamma with log link (non-canonical)
# 3. Gamma sandwich (vcovCL HC0-HC3)
# 4. Inverse Gaussian sandwich (vcovCL HC0-HC3)
# 5. Inverse Gaussian with log link (non-canonical)

library(jsonlite)
library(sandwich)

set.seed(42)

results <- list()

# ═══════════════════════════════════════════════════════════════════════
# 1. QUASIPOISSON: carb ~ wt + hp (mtcars)
# ═══════════════════════════════════════════════════════════════════════
cat("=== Quasipoisson ===\n")
df <- mtcars
fit_qp <- glm(carb ~ wt + hp, family = quasipoisson(), data = df)
s_qp <- summary(fit_qp)

results$quasipoisson <- list(
  wt = df$wt,
  hp = df$hp,
  y = df$carb,
  coef = unname(coef(fit_qp)),
  se = unname(s_qp$coefficients[, 2]),
  deviance = fit_qp$deviance,
  null_deviance = fit_qp$null.deviance,
  dispersion = s_qp$dispersion,
  fitted5 = unname(fitted(fit_qp)[1:5]),
  confint_lower = unname(confint.default(fit_qp)[, 1]),
  confint_upper = unname(confint.default(fit_qp)[, 2])
)
cat("coef:", results$quasipoisson$coef, "\n")
cat("SE:", results$quasipoisson$se, "\n")
cat("dispersion:", results$quasipoisson$dispersion, "\n")

# ═══════════════════════════════════════════════════════════════════════
# 2. GAMMA LOG LINK: y ~ x (simulated positive data)
# ═══════════════════════════════════════════════════════════════════════
cat("\n=== Gamma log link ===\n")
n <- 30
x_glog <- runif(n, 0.5, 3)
mu_glog <- exp(0.5 + 0.8 * x_glog)
y_glog <- rgamma(n, shape = 5, rate = 5 / mu_glog)

fit_glog <- glm(y_glog ~ x_glog, family = Gamma(link = "log"))
s_glog <- summary(fit_glog)

results$gamma_log <- list(
  x = x_glog,
  y = y_glog,
  coef = unname(coef(fit_glog)),
  se = unname(s_glog$coefficients[, 2]),
  deviance = fit_glog$deviance,
  null_deviance = fit_glog$null.deviance,
  aic = fit_glog$aic,
  dispersion = s_glog$dispersion,
  fitted5 = unname(fitted(fit_glog)[1:5]),
  confint_lower = unname(confint.default(fit_glog)[, 1]),
  confint_upper = unname(confint.default(fit_glog)[, 2])
)
cat("coef:", results$gamma_log$coef, "\n")
cat("SE:", results$gamma_log$se, "\n")

# ═══════════════════════════════════════════════════════════════════════
# 3. GAMMA SANDWICH (vcovCL HC0-HC3, clustered)
# ═══════════════════════════════════════════════════════════════════════
cat("\n=== Gamma sandwich ===\n")
n <- 20
x1_gs <- rnorm(n)
x2_gs <- rnorm(n)
mu_gs <- exp(0.5 + 0.3 * x1_gs - 0.2 * x2_gs)
y_gs <- rgamma(n, shape = 4, rate = 4 / mu_gs)
cluster_gs <- rep(1:5, each = 4)

fit_gs <- glm(y_gs ~ x1_gs + x2_gs, family = Gamma(link = "log"))

results$sandwich_gamma <- list(
  x1 = x1_gs,
  x2 = x2_gs,
  y = y_gs,
  cluster = cluster_gs,
  coef = unname(coef(fit_gs)),
  vcov_hc0 = unname(vcovCL(fit_gs, cluster = cluster_gs, type = "HC0", cadjust = TRUE)),
  vcov_hc1 = unname(vcovCL(fit_gs, cluster = cluster_gs, type = "HC1", cadjust = TRUE)),
  vcov_hc2 = unname(vcovCL(fit_gs, cluster = cluster_gs, type = "HC2", cadjust = TRUE)),
  vcov_hc3 = unname(vcovCL(fit_gs, cluster = cluster_gs, type = "HC3", cadjust = TRUE))
)
cat("coef:", results$sandwich_gamma$coef, "\n")
cat("HC0[1,1]:", results$sandwich_gamma$vcov_hc0[1, 1], "\n")

# ═══════════════════════════════════════════════════════════════════════
# 4. INVERSE GAUSSIAN SANDWICH (vcovCL HC0-HC3, clustered)
# ═══════════════════════════════════════════════════════════════════════
cat("\n=== InvGauss sandwich ===\n")
n <- 20
x1_ig <- rnorm(n, mean = 1, sd = 0.3)
x2_ig <- rnorm(n, mean = 0, sd = 0.3)
mu_ig <- exp(0.3 + 0.2 * x1_ig + 0.1 * x2_ig)
# statmod::rinvgauss or manual
y_ig <- 1 / rgamma(n, shape = 3, rate = 3 * mu_ig)
# Ensure positive
y_ig <- pmax(y_ig, 0.01)
cluster_ig <- rep(1:5, each = 4)

fit_ig <- glm(y_ig ~ x1_ig + x2_ig, family = inverse.gaussian(link = "1/mu^2"))

results$sandwich_invgauss <- list(
  x1 = x1_ig,
  x2 = x2_ig,
  y = y_ig,
  cluster = cluster_ig,
  coef = unname(coef(fit_ig)),
  vcov_hc0 = unname(vcovCL(fit_ig, cluster = cluster_ig, type = "HC0", cadjust = TRUE)),
  vcov_hc1 = unname(vcovCL(fit_ig, cluster = cluster_ig, type = "HC1", cadjust = TRUE)),
  vcov_hc2 = unname(vcovCL(fit_ig, cluster = cluster_ig, type = "HC2", cadjust = TRUE)),
  vcov_hc3 = unname(vcovCL(fit_ig, cluster = cluster_ig, type = "HC3", cadjust = TRUE))
)
cat("coef:", results$sandwich_invgauss$coef, "\n")
cat("HC0[1,1]:", results$sandwich_invgauss$vcov_hc0[1, 1], "\n")

# ═══════════════════════════════════════════════════════════════════════
# 5. INVERSE GAUSSIAN LOG LINK
# ═══════════════════════════════════════════════════════════════════════
cat("\n=== InvGauss log link ===\n")
n <- 30
x_iglog <- rnorm(n, mean = 1, sd = 0.5)
mu_iglog <- exp(0.2 + 0.3 * x_iglog)
y_iglog <- 1 / rgamma(n, shape = 5, rate = 5 * mu_iglog)
y_iglog <- pmax(y_iglog, 0.001)

fit_iglog <- glm(y_iglog ~ x_iglog, family = inverse.gaussian(link = "log"))
s_iglog <- summary(fit_iglog)

results$invgauss_log <- list(
  x = x_iglog,
  y = y_iglog,
  coef = unname(coef(fit_iglog)),
  se = unname(s_iglog$coefficients[, 2]),
  deviance = fit_iglog$deviance,
  null_deviance = fit_iglog$null.deviance,
  aic = fit_iglog$aic,
  dispersion = s_iglog$dispersion,
  fitted5 = unname(fitted(fit_iglog)[1:5])
)
cat("coef:", results$invgauss_log$coef, "\n")

# ═══════════════════════════════════════════════════════════════════════
# 6. QUASIPOISSON SANDWICH (vcovCL HC0-HC3, clustered)
# ═══════════════════════════════════════════════════════════════════════
cat("\n=== Quasipoisson sandwich ===\n")
# Use same data as sandwich_poisson from gap-refs.json but with quasipoisson
# Actually generate fresh data
n <- 20
x1_qps <- rnorm(n)
x2_qps <- rnorm(n)
mu_qps <- exp(0.5 + 0.3 * x1_qps - 0.2 * x2_qps)
y_qps <- rpois(n, lambda = mu_qps)
cluster_qps <- rep(1:5, each = 4)

fit_qps <- glm(y_qps ~ x1_qps + x2_qps, family = quasipoisson())
s_qps <- summary(fit_qps)

results$sandwich_quasipoisson <- list(
  x1 = x1_qps,
  x2 = x2_qps,
  y = y_qps,
  cluster = cluster_qps,
  coef = unname(coef(fit_qps)),
  se = unname(s_qps$coefficients[, 2]),
  dispersion = s_qps$dispersion,
  vcov_hc0 = unname(vcovCL(fit_qps, cluster = cluster_qps, type = "HC0", cadjust = TRUE)),
  vcov_hc1 = unname(vcovCL(fit_qps, cluster = cluster_qps, type = "HC1", cadjust = TRUE)),
  vcov_hc2 = unname(vcovCL(fit_qps, cluster = cluster_qps, type = "HC2", cadjust = TRUE)),
  vcov_hc3 = unname(vcovCL(fit_qps, cluster = cluster_qps, type = "HC3", cadjust = TRUE))
)
cat("coef:", results$sandwich_quasipoisson$coef, "\n")
cat("dispersion:", results$sandwich_quasipoisson$dispersion, "\n")

# ═══════════════════════════════════════════════════════════════════════
# Write out
# ═══════════════════════════════════════════════════════════════════════
write_json(results, "packages/testing/glm/family-gap-refs.json",
  digits = 17, pretty = FALSE, auto_unbox = TRUE)
cat("\nWrote family-gap-refs.json\n")
