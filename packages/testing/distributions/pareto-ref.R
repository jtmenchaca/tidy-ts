#!/usr/bin/env Rscript

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "../statistical_tests/source-tests/r-json-emit.R"))

# --- Manual Pareto functions (not in base R) ---
dpareto_r <- function(x, scale, shape) {
  ifelse(x < scale, 0, shape * scale^shape / x^(shape+1))
}
ppareto_r <- function(x, scale, shape) {
  ifelse(x < scale, 0, 1 - (scale/x)^shape)
}
qpareto_r <- function(p, scale, shape) {
  scale / (1 - p)^(1/shape)
}

# --- scale=1, shape=2 ---
s1a2_x <- c(0.5, 1, 2, 3, 5)
s1a2_p <- c(0.1, 0.25, 0.5, 0.75, 0.9)

s1a2_pdf <- dpareto_r(s1a2_x, 1, 2)
s1a2_cdf <- ppareto_r(s1a2_x, 1, 2)
s1a2_quantile <- qpareto_r(s1a2_p, 1, 2)

# --- scale=2, shape=0.5 ---
s2a05_x <- c(1, 2, 3, 5, 10)
s2a05_pdf <- dpareto_r(s2a05_x, 2, 0.5)
s2a05_cdf <- ppareto_r(s2a05_x, 2, 0.5)
s2a05_quantile <- qpareto_r(c(0.1, 0.5, 0.9), 2, 0.5)

# --- Edge cases ---
edge_below_pdf <- dpareto_r(0.5, 1, 2)   # should be 0
edge_below_cdf <- ppareto_r(0.5, 1, 2)   # should be 0
edge_at_scale <- dpareto_r(1, 1, 2)       # should be 2

# --- p-q round trip (scale=1, shape=2) ---
rt_x <- c(1.5, 2, 3, 5)
rt_result <- qpareto_r(ppareto_r(rt_x, 1, 2), 1, 2)

# --- Upper tail ---
upper_tail <- 1 - ppareto_r(3, 1, 2)

# --- Log ---
log_pdf <- log(dpareto_r(2, 1, 2))
log_cdf <- log(ppareto_r(2, 1, 2))

emit_reference(list(
  s1a2_pdf = s1a2_pdf,
  s1a2_cdf = s1a2_cdf,
  s1a2_quantile = s1a2_quantile,
  s2a05_pdf = s2a05_pdf,
  s2a05_cdf = s2a05_cdf,
  s2a05_quantile = s2a05_quantile,
  edge_below_pdf = edge_below_pdf,
  edge_below_cdf = edge_below_cdf,
  edge_at_scale = edge_at_scale,
  rt_x = rt_x,
  rt_result = rt_result,
  upper_tail = upper_tail,
  log_pdf = log_pdf,
  log_cdf = log_cdf
))
