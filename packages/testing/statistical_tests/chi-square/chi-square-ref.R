#!/usr/bin/env Rscript

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "..", "r-json-emit.R"))

# --- Scenario 1: independence_2x2 ---
# matrix(c(20, 30, 10, 40), nrow=2) produces:
#      [,1] [,2]
# [1,]   20   10
# [2,]   30   40
mat1 <- matrix(c(20, 30, 10, 40), nrow = 2)
res1 <- chisq.test(mat1)

# --- Scenario 2: independence_3x2 ---
# matrix(c(10, 20, 30, 25, 25, 20), nrow=3) produces:
#      [,1] [,2]
# [1,]   10   25
# [2,]   20   25
# [3,]   30   20
mat2 <- matrix(c(10, 20, 30, 25, 25, 20), nrow = 3)
res2 <- chisq.test(mat2)

# --- Scenario 3: goodness_of_fit ---
observed3 <- c(25, 30, 20, 25)
res3 <- chisq.test(observed3, p = c(0.25, 0.25, 0.25, 0.25))

# --- Scenario 4: goodness_unequal ---
observed4 <- c(40, 30, 20, 10)
res4 <- chisq.test(observed4, p = c(0.4, 0.3, 0.2, 0.1))

# --- Helper: high-precision conditional MLE for odds ratio ---
# R's fisher.test uses tol=1e-8 in uniroot which gives ~1e-5 precision on OR.
# We use tol=1e-12 for higher precision to match our implementation.
fisher_mle_precise <- function(a, b, c, d) {
  m <- a + c; n <- b + d; k <- a + b; x <- a
  lo <- max(0, k - n); hi <- min(k, m)
  if (x == lo) return(0)
  if (x == hi) return(Inf)

  # Expectation of non-central hypergeometric
  mnhyper <- function(ncp) {
    support <- lo:hi
    log_p <- lchoose(m, support) + lchoose(n, k - support) + log(ncp) * support
    p <- exp(log_p - max(log_p))
    p <- p / sum(p)
    sum(support * p)
  }

  mu <- mnhyper(1)
  if (abs(mu - x) < 1e-14) return(1)
  if (mu < x) {
    # Search in (1, Inf) via 1/t parameterization
    root <- uniroot(function(t) mnhyper(1/t) - x, c(.Machine$double.eps, 1), tol = 1e-12)
    return(1 / root$root)
  } else {
    root <- uniroot(function(ncp) mnhyper(ncp) - x, c(0, 1), tol = 1e-12)
    return(root$root)
  }
}

# --- Scenario 5: fisher_2x2 ---
# matrix(c(3, 1, 1, 3), nrow=2) produces:
#      [,1] [,2]
# [1,]    3    1
# [2,]    1    3
mat5 <- matrix(c(3, 1, 1, 3), nrow = 2)
res5 <- fisher.test(mat5)

# --- Scenario 6: fisher_one_sided ---
res6 <- fisher.test(mat5, alternative = "greater")

# --- Scenario 7: fisher_large_or ---
# matrix(c(10, 2, 1, 8), nrow=2) produces:
#      [,1] [,2]
# [1,]   10    1
# [2,]    2    8
mat7 <- matrix(c(10, 2, 1, 8), nrow = 2)
res7 <- fisher.test(mat7)

# Compute high-precision MLE odds ratios
or_5 <- fisher_mle_precise(3, 1, 1, 3)
or_7 <- fisher_mle_precise(10, 1, 2, 8)

# --- Helper: high-precision CI for Fisher's exact test ---
# R's fisher.test uses default uniroot tolerance which is insufficient for 1e-6.
# We compute CIs by exact inversion with tol=1e-12.
fisher_ci_precise <- function(a, b, c, d, alpha, alternative = "two.sided") {
  m <- a + c; n <- b + d; k <- a + b; x <- a
  lo <- max(0, k - n); hi <- min(k, m)

  pnhyper <- function(ncp, obs, upper_tail) {
    support <- lo:hi
    log_p <- lchoose(m, support) + lchoose(n, k - support) + log(ncp) * support
    p <- exp(log_p - max(log_p))
    p <- p / sum(p)
    if (upper_tail) sum(p[support >= obs]) else sum(p[support <= obs])
  }

  compute_lower <- function(tail_prob) {
    if (x == lo) return(0)
    uniroot(function(ncp) pnhyper(ncp, x, TRUE) - tail_prob,
            c(1e-10, 1e6), tol = 1e-12)$root
  }
  compute_upper <- function(tail_prob) {
    if (x == hi) return(Inf)
    uniroot(function(ncp) pnhyper(ncp, x, FALSE) - tail_prob,
            c(1e-10, 1e6), tol = 1e-12)$root
  }

  if (alternative == "greater") {
    return(c(compute_lower(alpha), Inf))
  } else if (alternative == "less") {
    return(c(0, compute_upper(alpha)))
  } else {
    return(c(compute_lower(alpha/2), compute_upper(alpha/2)))
  }
}

# Compute precise CIs
ci_5 <- fisher_ci_precise(3, 1, 1, 3, 0.05, "two.sided")
ci_6 <- fisher_ci_precise(3, 1, 1, 3, 0.05, "greater")
ci_7 <- fisher_ci_precise(10, 1, 2, 8, 0.05, "two.sided")

# --- Scenario 8: fisher_less ---
res8 <- fisher.test(mat5, alternative = "less")
ci_8 <- fisher_ci_precise(3, 1, 1, 3, 0.05, "less")

# For independence tests, emit expected and residuals in row-major order
# (matching the TS contingencyTable layout) using as.vector(t(...))
emit_reference(list(
  independence_2x2_statistic = unname(res1$statistic),
  independence_2x2_p_value = res1$p.value,
  independence_2x2_df = unname(res1$parameter),
  independence_2x2_expected = as.vector(t(res1$expected)),
  independence_2x2_residuals = as.vector(t(res1$residuals)),

  independence_3x2_statistic = unname(res2$statistic),
  independence_3x2_p_value = res2$p.value,
  independence_3x2_df = unname(res2$parameter),
  independence_3x2_expected = as.vector(t(res2$expected)),
  independence_3x2_residuals = as.vector(t(res2$residuals)),

  goodness_of_fit_statistic = unname(res3$statistic),
  goodness_of_fit_p_value = res3$p.value,
  goodness_of_fit_df = unname(res3$parameter),
  goodness_of_fit_expected = as.vector(res3$expected),
  goodness_of_fit_residuals = as.vector(res3$residuals),

  goodness_unequal_statistic = unname(res4$statistic),
  goodness_unequal_p_value = res4$p.value,
  goodness_unequal_df = unname(res4$parameter),
  goodness_unequal_expected = as.vector(res4$expected),
  goodness_unequal_residuals = as.vector(res4$residuals),

  fisher_2x2_p_value = res5$p.value,
  fisher_2x2_odds_ratio = or_5,
  fisher_2x2_conf_int_lower = ci_5[1],
  fisher_2x2_conf_int_upper = ci_5[2],

  fisher_one_sided_p_value = res6$p.value,
  fisher_one_sided_odds_ratio = or_5,
  fisher_one_sided_conf_int_lower = ci_6[1],
  fisher_one_sided_conf_int_upper = ci_6[2],

  fisher_large_or_p_value = res7$p.value,
  fisher_large_or_odds_ratio = or_7,
  fisher_large_or_conf_int_lower = ci_7[1],
  fisher_large_or_conf_int_upper = ci_7[2],

  fisher_less_p_value = res8$p.value,
  fisher_less_odds_ratio = or_5,
  fisher_less_conf_int_lower = ci_8[1],
  fisher_less_conf_int_upper = ci_8[2]
))
