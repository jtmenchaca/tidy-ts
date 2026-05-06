#!/usr/bin/env Rscript

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "../statistical_tests/source-tests/r-json-emit.R"))

# --- Binomial (n=10, p=0.5) ---
std_k <- c(0, 3, 5, 7, 10)
std_pdf <- dbinom(std_k, size = 10, prob = 0.5)
std_cdf <- pbinom(std_k, size = 10, prob = 0.5)

std_p <- c(0.1, 0.25, 0.5, 0.75, 0.9)
std_quantile <- qbinom(std_p, size = 10, prob = 0.5)

# --- Binomial (n=20, p=0.3) ---
ns_k <- c(0, 3, 6, 10, 15, 20)
ns_pdf <- dbinom(ns_k, size = 20, prob = 0.3)
ns_cdf <- pbinom(ns_k, size = 20, prob = 0.3)

ns_p <- c(0.1, 0.5, 0.9)
ns_quantile <- qbinom(ns_p, size = 20, prob = 0.3)

# --- Upper tail ---
upper_tail <- pbinom(5, size = 10, prob = 0.5, lower.tail = FALSE)

# --- Log scale ---
log_pdf <- dbinom(5, size = 10, prob = 0.5, log = TRUE)

# --- Edge cases ---
edge_p0 <- dbinom(0, size = 10, prob = 0)    # should be 1
edge_p1 <- dbinom(10, size = 10, prob = 1)   # should be 1

# --- Cumsum consistency ---
cumsum_pdf <- cumsum(dbinom(0:10, 10, 0.5))
cumsum_cdf <- pbinom(0:10, 10, 0.5)

# --- Log CDF ---
log_cdf <- pbinom(5, size = 10, prob = 0.5, log.p = TRUE)

# --- p-q round trip (discrete: use fudge) ---
rt_x <- c(2, 4, 6, 8)
f1 <- 1 - 1e-7
rt_result <- qbinom(pbinom(rt_x, size = 10, prob = 0.5) * f1, size = 10, prob = 0.5)

emit_reference(list(
  std_pdf = std_pdf,
  std_cdf = std_cdf,
  std_quantile = std_quantile,
  ns_pdf = ns_pdf,
  ns_cdf = ns_cdf,
  ns_quantile = ns_quantile,
  upper_tail = upper_tail,
  log_pdf = log_pdf,
  edge_p0 = edge_p0,
  edge_p1 = edge_p1,
  cumsum_pdf = cumsum_pdf,
  cumsum_cdf = cumsum_cdf,
  log_cdf = log_cdf,
  rt_x = rt_x,
  rt_result = rt_result
))
