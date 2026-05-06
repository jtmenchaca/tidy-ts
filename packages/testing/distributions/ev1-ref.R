#!/usr/bin/env Rscript

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "../statistical_tests/source-tests/r-json-emit.R"))

# --- Manual Gumbel (maximum type) functions ---
# Reference: R survival package survreg.distributions.R, survregc1.c (exvalue_d)
# PDF:  f(x) = (1/scale) * exp(-(z + exp(-z)))  where z = (x - loc) / scale
# CDF:  F(x) = exp(-exp(-z))
# QF:   Q(p) = loc - scale * log(-log(p))
dev1_r <- function(x, loc = 0, scale = 1) {
  z <- (x - loc) / scale
  (1 / scale) * exp(-(z + exp(-z)))
}
pev1_r <- function(x, loc = 0, scale = 1) {
  z <- (x - loc) / scale
  exp(-exp(-z))
}
qev1_r <- function(p, loc = 0, scale = 1) {
  loc - scale * log(-log(p))
}

# --- loc=0, scale=1 ---
std_x <- c(-2, -1, 0, 1, 3, 5)
std_p <- c(0.1, 0.25, 0.5, 0.75, 0.9)

std_pdf <- dev1_r(std_x)
std_cdf <- pev1_r(std_x)
std_quantile <- qev1_r(std_p)

# --- loc=2, scale=0.5 ---
ns_x <- c(0, 1, 2, 3, 4)
ns_p <- c(0.1, 0.5, 0.9)

ns_pdf <- dev1_r(ns_x, 2, 0.5)
ns_cdf <- pev1_r(ns_x, 2, 0.5)
ns_quantile <- qev1_r(ns_p, 2, 0.5)

# --- Upper tail ---
upper_tail <- 1 - pev1_r(2, 0, 1)

# --- Log density ---
log_pdf <- log(dev1_r(0, 0, 1))

# --- Log CDF ---
log_cdf <- log(pev1_r(0, 0, 1))

# --- p-q round trip ---
rt_x <- c(-1, 0, 1, 3)
rt_result <- qev1_r(pev1_r(rt_x, 0, 1), 0, 1)

emit_reference(list(
  std_x = std_x,
  std_pdf = std_pdf,
  std_cdf = std_cdf,
  std_p = std_p,
  std_quantile = std_quantile,
  ns_x = ns_x,
  ns_pdf = ns_pdf,
  ns_cdf = ns_cdf,
  ns_p = ns_p,
  ns_quantile = ns_quantile,
  upper_tail = upper_tail,
  log_pdf = log_pdf,
  log_cdf = log_cdf,
  rt_x = rt_x,
  rt_result = rt_result
))
