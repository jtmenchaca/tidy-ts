#!/usr/bin/env Rscript

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "../statistical_tests/source-tests/r-json-emit.R"))

# --- Dirac delta (point mass) distribution ---
# This is the degenerate distribution: all mass at a single point.
# Equivalent to Normal(loc, sd=0) or Uniform(loc, loc).
#
# PDF:  f(x) = Inf if x == loc, 0 otherwise
# CDF:  F(x) = 0 if x < loc, 1 if x >= loc
# QF:   Q(p) = loc for any p in (0, 1]
#
# We use R's built-in dnorm/pnorm/qnorm with sd=0 for reference values.

# --- loc=0: density ---
d_x <- c(-1, 0, 1)
d_pdf <- dnorm(d_x, mean = 0, sd = 0)

# --- loc=0: CDF ---
p_x <- c(-1, 0, 1)
p_cdf <- pnorm(p_x, mean = 0, sd = 0)

# --- loc=0: quantile ---
q_p <- c(0.1, 0.5, 0.9)
q_result <- qnorm(q_p, mean = 0, sd = 0)

# --- loc=3: density ---
d3_x <- c(2, 3, 4)
d3_pdf <- dnorm(d3_x, mean = 3, sd = 0)

# --- loc=3: CDF ---
p3_x <- c(2, 3, 4)
p3_cdf <- pnorm(p3_x, mean = 3, sd = 0)

# --- loc=3: quantile ---
q3_result <- qnorm(q_p, mean = 3, sd = 0)

# --- Upper tail ---
upper_below <- pnorm(-1, mean = 0, sd = 0, lower.tail = FALSE)
upper_at <- pnorm(0, mean = 0, sd = 0, lower.tail = FALSE)
upper_above <- pnorm(1, mean = 0, sd = 0, lower.tail = FALSE)

emit_reference(list(
  d_x = d_x,
  d_pdf = d_pdf,
  p_x = p_x,
  p_cdf = p_cdf,
  q_p = q_p,
  q_result = q_result,
  d3_x = d3_x,
  d3_pdf = d3_pdf,
  p3_x = p3_x,
  p3_cdf = p3_cdf,
  q3_result = q3_result,
  upper_below = upper_below,
  upper_at = upper_at,
  upper_above = upper_above
))
