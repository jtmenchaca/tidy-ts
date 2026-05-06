#!/usr/bin/env Rscript

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "../statistical_tests/source-tests/r-json-emit.R"))

# --- Standard uniform (min=0, max=1) ---
x1 <- c(-0.5, 0, 0.25, 0.5, 0.75, 1, 1.5)
p1 <- c(0, 0.1, 0.25, 0.5, 0.75, 0.9, 1)

pdf_std <- dunif(x1)
cdf_std <- punif(x1)
quantile_std <- qunif(p1)

# --- Custom uniform (min=2, max=5) ---
x2 <- c(1, 2, 3.5, 5, 6)
p2 <- c(0, 0.5, 1)

pdf_custom <- dunif(x2, min = 2, max = 5)
cdf_custom <- punif(x2, min = 2, max = 5)
quantile_custom <- qunif(p2, min = 2, max = 5)

# --- Upper tail ---
upper_tail <- punif(0.7, lower.tail = FALSE)

# --- Log scale ---
log_pdf <- dunif(0.5, log = TRUE)

# --- p-q round trip (min=0.2, max=2) ---
rt_x <- c(0.3, 0.5, 0.8, 1.2, 1.8)
rt_result <- qunif(punif(rt_x, min = 0.2, max = 2), min = 0.2, max = 2)

# --- Log CDF ---
log_cdf <- punif(0.5, log.p = TRUE)

emit_reference(list(
  pdf_std = pdf_std,
  cdf_std = cdf_std,
  quantile_std = quantile_std,
  pdf_custom = pdf_custom,
  cdf_custom = cdf_custom,
  quantile_custom = quantile_custom,
  upper_tail = upper_tail,
  log_pdf = log_pdf,
  rt_x = rt_x,
  rt_result = rt_result,
  log_cdf = log_cdf
))
