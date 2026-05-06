#!/usr/bin/env Rscript

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "../statistical_tests/source-tests/r-json-emit.R"))

# --- Standard normal: dnorm ---
std_dnorm_x <- c(-3, -1, 0, 1, 3)
std_dnorm_vals <- dnorm(std_dnorm_x)

# --- Standard normal: pnorm ---
std_pnorm_vals <- pnorm(std_dnorm_x)

# --- Standard normal: qnorm ---
std_qnorm_p <- c(0.01, 0.05, 0.25, 0.5, 0.75, 0.95, 0.99)
std_qnorm_vals <- qnorm(std_qnorm_p)

# --- Non-standard (mean=5, sd=2): dnorm, pnorm ---
ns_x <- c(1, 3, 5, 7, 9)
ns_dnorm_vals <- dnorm(ns_x, mean = 5, sd = 2)
ns_pnorm_vals <- pnorm(ns_x, mean = 5, sd = 2)

# --- Non-standard: qnorm ---
ns_qnorm_p <- c(0.1, 0.5, 0.9)
ns_qnorm_vals <- qnorm(ns_qnorm_p, mean = 5, sd = 2)

# --- Upper tail ---
upper_tail_196 <- pnorm(1.96, lower.tail = FALSE)
upper_tail_neg196 <- pnorm(-1.96, lower.tail = FALSE)

# --- Log scale ---
log_dnorm_0 <- dnorm(0, log = TRUE)
log_pnorm_0 <- pnorm(0, log.p = TRUE)

# --- Edge: sd=0 ---
edge_sd0_dnorm <- c(dnorm(2, mean = 3, sd = 0),
                     dnorm(3, mean = 3, sd = 0),
                     dnorm(4, mean = 3, sd = 0))
edge_sd0_pnorm <- c(pnorm(2, mean = 3, sd = 0),
                     pnorm(3, mean = 3, sd = 0),
                     pnorm(4, mean = 3, sd = 0))

# --- Extreme tails ---
extreme_qnorm_1e20 <- qnorm(1e-20)
extreme_qnorm_1e100 <- qnorm(1e-100)
extreme_qnorm_1e300 <- qnorm(1e-300)

# --- p-q round trip ---
roundtrip_x <- c(-2, -1, 0, 1, 2)
roundtrip_vals <- qnorm(pnorm(roundtrip_x))

emit_reference(list(
  std_dnorm_x = std_dnorm_x,
  std_dnorm_vals = std_dnorm_vals,
  std_pnorm_vals = std_pnorm_vals,
  std_qnorm_p = std_qnorm_p,
  std_qnorm_vals = std_qnorm_vals,
  ns_x = ns_x,
  ns_dnorm_vals = ns_dnorm_vals,
  ns_pnorm_vals = ns_pnorm_vals,
  ns_qnorm_p = ns_qnorm_p,
  ns_qnorm_vals = ns_qnorm_vals,
  upper_tail_196 = upper_tail_196,
  upper_tail_neg196 = upper_tail_neg196,
  log_dnorm_0 = log_dnorm_0,
  log_pnorm_0 = log_pnorm_0,
  edge_sd0_dnorm = edge_sd0_dnorm,
  edge_sd0_pnorm = edge_sd0_pnorm,
  extreme_qnorm_1e20 = extreme_qnorm_1e20,
  extreme_qnorm_1e100 = extreme_qnorm_1e100,
  extreme_qnorm_1e300 = extreme_qnorm_1e300,
  roundtrip_x = roundtrip_x,
  roundtrip_vals = roundtrip_vals
))
