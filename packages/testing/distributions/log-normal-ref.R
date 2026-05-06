#!/usr/bin/env Rscript

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "../statistical_tests/source-tests/r-json-emit.R"))

# --- Standard log-normal (meanlog=0, sdlog=1) ---
std_x <- c(0.5, 1, 2, 3, 5)
std_pdf <- dlnorm(std_x)
std_cdf <- plnorm(std_x)

std_p <- c(0.1, 0.25, 0.5, 0.75, 0.9)
std_quantile <- qlnorm(std_p)

# --- Non-standard (meanlog=1, sdlog=0.5) ---
ns_x <- c(1, 2, 3, 5)
ns_pdf <- dlnorm(ns_x, meanlog = 1, sdlog = 0.5)
ns_cdf <- plnorm(ns_x, meanlog = 1, sdlog = 0.5)

ns_p <- c(0.1, 0.5, 0.9)
ns_quantile <- qlnorm(ns_p, meanlog = 1, sdlog = 0.5)

# --- Upper tail ---
upper_tail <- plnorm(2, lower.tail = FALSE)

# --- Log scale ---
log_pdf <- dlnorm(1, log = TRUE)
log_cdf <- plnorm(1, log.p = TRUE)

# --- Edge cases ---
edge_dlnorm_zero <- dlnorm(0)  # should be 0

# Edge sdlog=0: degenerate distribution
edge_sd0_pdf <- dlnorm(c(0.5, 1, 2), meanlog = 0, sdlog = 0)   # c(0, Inf, 0)
edge_sd0_cdf <- plnorm(c(0.5, 1, 2), meanlog = 0, sdlog = 0)   # c(0, 1, 1)

# --- p-q round trip (meanlog=-1, sdlog=3) ---
rt_x <- c(0.1, 0.5, 1, 2, 5)
rt_result <- qlnorm(plnorm(rt_x, meanlog = -1, sdlog = 3), meanlog = -1, sdlog = 3)

emit_reference(list(
  std_pdf = std_pdf,
  std_cdf = std_cdf,
  std_quantile = std_quantile,
  ns_pdf = ns_pdf,
  ns_cdf = ns_cdf,
  ns_quantile = ns_quantile,
  upper_tail = upper_tail,
  log_pdf = log_pdf,
  log_cdf = log_cdf,
  edge_dlnorm_zero = edge_dlnorm_zero,
  edge_sd0_pdf = edge_sd0_pdf,
  edge_sd0_cdf = edge_sd0_cdf,
  rt_x = rt_x,
  rt_result = rt_result
))
