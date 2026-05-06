#!/usr/bin/env Rscript

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "../statistical_tests/source-tests/r-json-emit.R"))

# --- Symmetric beta (alpha=2, beta=2) ---
sym_x <- c(0.1, 0.25, 0.5, 0.75, 0.9)
sym_p <- c(0.1, 0.25, 0.5, 0.75, 0.9)

sym_pdf <- dbeta(sym_x, 2, 2)
sym_cdf <- pbeta(sym_x, 2, 2)
sym_quantile <- qbeta(sym_p, 2, 2)

# --- Asymmetric beta (alpha=0.5, beta=5) ---
asym_x <- c(0.01, 0.05, 0.1, 0.3, 0.5)
asym_p <- c(0.1, 0.5, 0.9)

asym_pdf <- dbeta(asym_x, 0.5, 5)
asym_cdf <- pbeta(asym_x, 0.5, 5)
asym_quantile <- qbeta(asym_p, 0.5, 5)

# --- Upper tail ---
upper_tail <- pbeta(0.3, 2, 5, lower.tail = FALSE)

# --- Log scale ---
log_pdf <- dbeta(0.5, 2, 2, log = TRUE)
log_cdf <- pbeta(0.5, 2, 2, log.p = TRUE)

# --- Edge cases ---
edge_zero_alpha_half <- dbeta(0, 0.5, 2)   # Inf
edge_one_beta_half <- dbeta(1, 2, 0.5)     # Inf
edge_zero_alpha_two <- dbeta(0, 2, 2)      # 0

# --- p-q round trip (alpha=0.8, beta=2) ---
rt_x <- c(0.1, 0.3, 0.5, 0.7, 0.9)
rt_result <- qbeta(pbeta(rt_x, 0.8, 2), 0.8, 2)

emit_reference(list(
  sym_pdf = sym_pdf,
  sym_cdf = sym_cdf,
  sym_quantile = sym_quantile,
  asym_pdf = asym_pdf,
  asym_cdf = asym_cdf,
  asym_quantile = asym_quantile,
  upper_tail = upper_tail,
  log_pdf = log_pdf,
  log_cdf = log_cdf,
  edge_zero_alpha_half = edge_zero_alpha_half,
  edge_one_beta_half = edge_one_beta_half,
  edge_zero_alpha_two = edge_zero_alpha_two,
  rt_x = rt_x,
  rt_result = rt_result
))
