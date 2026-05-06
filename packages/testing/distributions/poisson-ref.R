#!/usr/bin/env Rscript

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "../statistical_tests/source-tests/r-json-emit.R"))

# --- Poisson (lambda=5) ---
std_k <- c(0, 1, 3, 5, 8, 12)
std_pdf <- dpois(std_k, lambda = 5)
std_cdf <- ppois(std_k, lambda = 5)

std_p <- c(0.1, 0.25, 0.5, 0.75, 0.9)
std_quantile <- qpois(std_p, lambda = 5)

# --- Poisson (lambda=0.5) ---
ns_k <- c(0, 1, 2, 3, 5)
ns_pdf <- dpois(ns_k, lambda = 0.5)
ns_cdf <- ppois(ns_k, lambda = 0.5)

ns_p <- c(0.1, 0.5, 0.9)
ns_quantile <- qpois(ns_p, lambda = 0.5)

# --- Upper tail ---
upper_tail <- ppois(5, lambda = 5, lower.tail = FALSE)

# --- Log scale ---
log_pdf <- dpois(5, lambda = 5, log = TRUE)

# --- Edge cases ---
edge_lambda0_pdf <- dpois(0:5, lambda = 0)   # c(1, 0, 0, 0, 0, 0)
edge_lambda0_quantile <- qpois(c(0, 0.5, 1 - 1e-7), lambda = 0)   # c(0, 0, 0)

# --- Cumsum consistency ---
cumsum_pdf <- cumsum(dpois(0:15, 5))
cumsum_cdf <- ppois(0:15, 5)

# --- Log CDF ---
log_cdf <- ppois(5, lambda = 5, log.p = TRUE)

# --- p-q round trip (discrete: use fudge) ---
rt_x <- c(1, 3, 5, 8)
f1 <- 1 - 1e-7
rt_result <- qpois(ppois(rt_x, lambda = 5) * f1, lambda = 5)

emit_reference(list(
  std_pdf = std_pdf,
  std_cdf = std_cdf,
  std_quantile = std_quantile,
  ns_pdf = ns_pdf,
  ns_cdf = ns_cdf,
  ns_quantile = ns_quantile,
  upper_tail = upper_tail,
  log_pdf = log_pdf,
  edge_lambda0_pdf = edge_lambda0_pdf,
  edge_lambda0_quantile = edge_lambda0_quantile,
  cumsum_pdf = cumsum_pdf,
  cumsum_cdf = cumsum_cdf,
  log_cdf = log_cdf,
  rt_x = rt_x,
  rt_result = rt_result
))
