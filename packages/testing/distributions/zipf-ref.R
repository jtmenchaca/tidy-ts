#!/usr/bin/env Rscript

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "../statistical_tests/source-tests/r-json-emit.R"))

# --- Manual Zipf distribution functions ---
# Reference: zipfR package (Evert, 2004)
# PMF:  P(k) = 1 / (k^s * H(N,s))  for k = 1, ..., N
# where H(N,s) = sum_{i=1}^{N} 1/i^s  (generalized harmonic number)
harmonic <- function(n, s) sum((1:n)^(-s))

dzipf_r <- function(k, n, s) {
  ifelse(k < 1 | k > n, 0, k^(-s) / harmonic(n, s))
}
pzipf_r <- function(k, n, s) {
  sapply(k, function(ki) {
    if (ki < 1) return(0)
    if (ki >= n) return(1)
    sum((1:floor(ki))^(-s)) / harmonic(n, s)
  })
}
qzipf_r <- function(p, n, s) {
  H <- harmonic(n, s)
  sapply(p, function(pi) {
    cumsum_val <- 0
    for (k in 1:n) {
      cumsum_val <- cumsum_val + k^(-s)
      if (cumsum_val / H >= pi) return(k)
    }
    return(n)
  })
}

# --- N=10, s=1.5 ---
std_k <- c(1, 2, 3, 5, 10)
std_p <- c(0.1, 0.25, 0.5, 0.75, 0.9)

std_pdf <- dzipf_r(std_k, 10, 1.5)
std_cdf <- pzipf_r(std_k, 10, 1.5)
std_quantile <- qzipf_r(std_p, 10, 1.5)

# --- N=100, s=2 ---
ns_k <- c(1, 2, 5, 10, 50, 100)
ns_p <- c(0.1, 0.5, 0.9)

ns_pdf <- dzipf_r(ns_k, 100, 2)
ns_cdf <- pzipf_r(ns_k, 100, 2)
ns_quantile <- qzipf_r(ns_p, 100, 2)

# --- Log density ---
log_pdf <- log(dzipf_r(1, 10, 1.5))

# --- Log CDF ---
log_cdf <- log(pzipf_r(3, 10, 1.5))

# --- Edge: k outside support ---
edge_below <- dzipf_r(0, 10, 1.5)
edge_above <- dzipf_r(11, 10, 1.5)

# --- Cumsum consistency ---
cumsum_pdf <- cumsum(dzipf_r(1:10, 10, 1.5))
cumsum_cdf <- pzipf_r(1:10, 10, 1.5)

# --- p-q round trip (discrete: use fudge) ---
rt_k <- c(1, 3, 5, 8)
f1 <- 1 - 1e-7
rt_result <- qzipf_r(pzipf_r(rt_k, 10, 1.5) * f1, 10, 1.5)

emit_reference(list(
  std_k = std_k,
  std_pdf = std_pdf,
  std_cdf = std_cdf,
  std_p = std_p,
  std_quantile = std_quantile,
  ns_k = ns_k,
  ns_pdf = ns_pdf,
  ns_cdf = ns_cdf,
  ns_p = ns_p,
  ns_quantile = ns_quantile,
  log_pdf = log_pdf,
  log_cdf = log_cdf,
  edge_below = edge_below,
  edge_above = edge_above,
  cumsum_pdf = cumsum_pdf,
  cumsum_cdf = cumsum_cdf,
  rt_k = rt_k,
  rt_result = rt_result
))
