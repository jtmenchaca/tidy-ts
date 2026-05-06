#!/usr/bin/env Rscript

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "../statistical_tests/source-tests/r-json-emit.R"))

# --- size=5, prob=0.5 ---
x1 <- c(0, 2, 5, 8, 12)
p1 <- c(0.1, 0.25, 0.5, 0.75, 0.9)

dnbinom_s5p05 <- dnbinom(x1, size = 5, prob = 0.5)
pnbinom_s5p05 <- pnbinom(x1, size = 5, prob = 0.5)
qnbinom_s5p05 <- qnbinom(p1, size = 5, prob = 0.5)

# --- size=1.2, prob=0.5 ---
x2 <- c(0, 1, 3, 5, 7)
p2 <- c(0.1, 0.5, 0.9)

dnbinom_s12p05 <- dnbinom(x2, size = 1.2, prob = 0.5)
pnbinom_s12p05 <- pnbinom(x2, size = 1.2, prob = 0.5)
qnbinom_s12p05 <- qnbinom(p2, size = 1.2, prob = 0.5)

# --- Upper tail ---
pnbinom_upper <- pnbinom(5, size = 5, prob = 0.5, lower.tail = FALSE)

# --- Log ---
dnbinom_log <- dnbinom(3, size = 5, prob = 0.5, log = TRUE)

# --- Cumsum consistency ---
cumsum_dnbinom <- cumsum(dnbinom(0:7, size = 1.2, prob = 0.5))
pnbinom_0_7 <- pnbinom(0:7, size = 1.2, prob = 0.5)
cumsum_matches <- all(abs(cumsum_dnbinom - pnbinom_0_7) < 1e-14)

# --- PR#842: fractional size ---
pnbinom_pr842 <- pnbinom(c(1, 3), size = 0.9, prob = 0.5)

# --- Convergence to Poisson ---
dnbinom_poisson <- dnbinom(0:10, size = 1e6, prob = 1e6 / (1e6 + 5))
dpois_lambda5 <- dpois(0:10, lambda = 5)

# --- Log CDF ---
pnbinom_log <- pnbinom(5, size = 5, prob = 0.5, log.p = TRUE)

# --- p-q round trip (discrete: use fudge) ---
rt_x <- c(0, 2, 5, 8)
f1 <- 1 - 1e-7
rt_result <- qnbinom(pnbinom(rt_x, size = 5, prob = 0.5) * f1, size = 5, prob = 0.5)

emit_reference(list(
  dnbinom_s5p05 = dnbinom_s5p05,
  pnbinom_s5p05 = pnbinom_s5p05,
  qnbinom_s5p05 = qnbinom_s5p05,
  dnbinom_s12p05 = dnbinom_s12p05,
  pnbinom_s12p05 = pnbinom_s12p05,
  qnbinom_s12p05 = qnbinom_s12p05,
  pnbinom_upper = pnbinom_upper,
  dnbinom_log = dnbinom_log,
  cumsum_dnbinom = cumsum_dnbinom,
  pnbinom_0_7 = pnbinom_0_7,
  cumsum_matches = cumsum_matches,
  pnbinom_pr842 = pnbinom_pr842,
  dnbinom_poisson = dnbinom_poisson,
  dpois_lambda5 = dpois_lambda5,
  pnbinom_log = pnbinom_log,
  rt_x = rt_x,
  rt_result = rt_result
))
