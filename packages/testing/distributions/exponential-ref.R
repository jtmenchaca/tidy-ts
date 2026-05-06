#!/usr/bin/env Rscript

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "../statistical_tests/source-tests/r-json-emit.R"))

# --- rate=1: dexp ---
rate1_x <- c(0, 0.5, 1, 2, 5)
rate1_dexp <- dexp(rate1_x, rate = 1)

# --- rate=1: pexp ---
rate1_pexp <- pexp(rate1_x, rate = 1)

# --- rate=1: qexp ---
rate1_qexp_p <- c(0.1, 0.25, 0.5, 0.75, 0.9)
rate1_qexp <- qexp(rate1_qexp_p, rate = 1)

# --- rate=0.5: dexp, pexp ---
rate05_x <- c(0, 1, 2, 5)
rate05_dexp <- dexp(rate05_x, rate = 0.5)
rate05_pexp <- pexp(rate05_x, rate = 0.5)

# --- rate=0.5: qexp ---
rate05_qexp_p <- c(0.1, 0.5, 0.9)
rate05_qexp <- qexp(rate05_qexp_p, rate = 0.5)

# --- Upper tail ---
upper_tail <- pexp(1, rate = 1, lower.tail = FALSE)

# --- Log ---
log_dexp <- dexp(1, rate = 1, log = TRUE)
log_pexp <- pexp(1, rate = 1, log.p = TRUE)

# --- Edge: dexp(0, rate=1) should equal rate=1 ---
edge_dexp_0 <- dexp(0, rate = 1)

# --- Extreme ---
extreme_pexp_1e10 <- pexp(1e10, rate = 1)
extreme_pexp_1e100 <- pexp(1e100, rate = 1)
extreme_pexp_1e300 <- pexp(1e300, rate = 1)

emit_reference(list(
  rate1_x = rate1_x,
  rate1_dexp = rate1_dexp,
  rate1_pexp = rate1_pexp,
  rate1_qexp_p = rate1_qexp_p,
  rate1_qexp = rate1_qexp,
  rate05_x = rate05_x,
  rate05_dexp = rate05_dexp,
  rate05_pexp = rate05_pexp,
  rate05_qexp_p = rate05_qexp_p,
  rate05_qexp = rate05_qexp,
  upper_tail = upper_tail,
  log_dexp = log_dexp,
  log_pexp = log_pexp,
  edge_dexp_0 = edge_dexp_0,
  extreme_pexp_1e10 = extreme_pexp_1e10,
  extreme_pexp_1e100 = extreme_pexp_1e100,
  extreme_pexp_1e300 = extreme_pexp_1e300
))
