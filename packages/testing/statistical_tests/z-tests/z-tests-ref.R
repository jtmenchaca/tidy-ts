#!/usr/bin/env Rscript

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "..", "r-json-emit.R"))

# Z-test is not built into base R, so we compute manually to match our impl.
# Z = (xbar - mu) / (sigma / sqrt(n))
# CI: xbar +/- z_crit * sigma/sqrt(n)  (two-sided uses alpha/2, one-sided uses alpha)

z_test <- function(x, mu, sigma, alternative = "two.sided", alpha = 0.05) {
  n <- length(x)
  xbar <- mean(x)
  se <- sigma / sqrt(n)
  z <- (xbar - mu) / se

  if (alternative == "two.sided") {
    p <- 2 * pnorm(-abs(z))
    z_crit <- qnorm(1 - alpha / 2)
    ci <- c(xbar - z_crit * se, xbar + z_crit * se)
  } else if (alternative == "less") {
    p <- pnorm(z)
    z_crit <- qnorm(1 - alpha)
    ci <- c(-Inf, xbar + z_crit * se)
  } else {  # greater
    p <- 1 - pnorm(z)
    z_crit <- qnorm(1 - alpha)
    ci <- c(xbar - z_crit * se, Inf)
  }
  list(statistic = z, p.value = p, conf.int = ci, estimate = xbar, se = se)
}

z_test_two <- function(x, y, sigma_x, sigma_y, alternative = "two.sided", alpha = 0.05) {
  n1 <- length(x)
  n2 <- length(y)
  xbar1 <- mean(x)
  xbar2 <- mean(y)
  diff <- xbar1 - xbar2
  se <- sqrt(sigma_x^2 / n1 + sigma_y^2 / n2)
  z <- diff / se

  if (alternative == "two.sided") {
    p <- 2 * pnorm(-abs(z))
    z_crit <- qnorm(1 - alpha / 2)
    ci <- c(diff - z_crit * se, diff + z_crit * se)
  } else if (alternative == "less") {
    p <- pnorm(z)
    z_crit <- qnorm(1 - alpha)
    ci <- c(-Inf, diff + z_crit * se)
  } else {  # greater
    p <- 1 - pnorm(z)
    z_crit <- qnorm(1 - alpha)
    ci <- c(diff - z_crit * se, Inf)
  }
  list(statistic = z, p.value = p, conf.int = ci, estimate = diff, se = se)
}

# --- Scenario 1: one_sample_two_sided ---
data1 <- c(12.5, 13.1, 11.8, 12.9, 13.3, 12.2, 12.7, 13.0)
res <- z_test(data1, mu = 12.0, sigma = 0.8)
one_sample_two_sided <- list(
  one_two_statistic = res$statistic,
  one_two_p_value = res$p.value,
  one_two_ci_lower = res$conf.int[1],
  one_two_ci_upper = res$conf.int[2],
  one_two_estimate = res$estimate
)

# --- Scenario 2: one_sample_less ---
res <- z_test(data1, mu = 13.0, sigma = 0.8, alternative = "less")
one_sample_less <- list(
  one_less_statistic = res$statistic,
  one_less_p_value = res$p.value,
  one_less_ci_lower = res$conf.int[1],
  one_less_ci_upper = res$conf.int[2],
  one_less_estimate = res$estimate
)

# --- Scenario 3: one_sample_greater ---
res <- z_test(data1, mu = 12.0, sigma = 0.8, alternative = "greater")
one_sample_greater <- list(
  one_greater_statistic = res$statistic,
  one_greater_p_value = res$p.value,
  one_greater_ci_lower = res$conf.int[1],
  one_greater_ci_upper = res$conf.int[2],
  one_greater_estimate = res$estimate
)

# --- Scenario 4: two_sample_two_sided ---
group1 <- c(23.5, 24.1, 22.8, 23.9, 24.3)
group2 <- c(21.2, 20.7, 21.8, 20.9, 21.5)
res <- z_test_two(group1, group2, sigma_x = 1.2, sigma_y = 1.0)
two_sample_two_sided <- list(
  two_two_statistic = res$statistic,
  two_two_p_value = res$p.value,
  two_two_ci_lower = res$conf.int[1],
  two_two_ci_upper = res$conf.int[2],
  two_two_estimate = res$estimate
)

# --- Scenario 5: two_sample_greater ---
res <- z_test_two(group1, group2, sigma_x = 1.2, sigma_y = 1.0, alternative = "greater")
two_sample_greater <- list(
  two_greater_statistic = res$statistic,
  two_greater_p_value = res$p.value,
  two_greater_ci_lower = res$conf.int[1],
  two_greater_ci_upper = res$conf.int[2],
  two_greater_estimate = res$estimate
)

# --- Scenario 6: two_sample_less ---
res <- z_test_two(group1, group2, sigma_x = 1.2, sigma_y = 1.0, alternative = "less")
two_sample_less <- list(
  two_less_statistic = res$statistic,
  two_less_p_value = res$p.value,
  two_less_ci_lower = res$conf.int[1],
  two_less_ci_upper = res$conf.int[2],
  two_less_estimate = res$estimate
)

# --- Scenario 7: one_sample_alpha_01 ---
res <- z_test(data1, mu = 12.0, sigma = 0.8, alpha = 0.01)
one_sample_alpha_01 <- list(
  one_alpha01_statistic = res$statistic,
  one_alpha01_p_value = res$p.value,
  one_alpha01_ci_lower = res$conf.int[1],
  one_alpha01_ci_upper = res$conf.int[2],
  one_alpha01_estimate = res$estimate
)

emit_reference(c(
  one_sample_two_sided,
  one_sample_less,
  one_sample_greater,
  two_sample_two_sided,
  two_sample_greater,
  two_sample_less,
  one_sample_alpha_01
))
