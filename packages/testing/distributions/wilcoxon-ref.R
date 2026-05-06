#!/usr/bin/env Rscript

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "../statistical_tests/source-tests/r-json-emit.R"))

# --- m=4, n=6 ---
m4n6_x <- c(0, 5, 10, 15, 20, 24)
m4n6_p <- c(0.1, 0.25, 0.5, 0.75, 0.9)

m4n6_pdf <- dwilcox(m4n6_x, 4, 6)
m4n6_cdf <- pwilcox(m4n6_x, 4, 6)
m4n6_quantile <- qwilcox(m4n6_p, 4, 6)

# --- Symmetry: dwilcox(0:24, 4, 6) vs dwilcox(0:24, 6, 4) ---
sym_x <- 0:24
sym_46 <- dwilcox(sym_x, 4, 6)
sym_64 <- dwilcox(sym_x, 6, 4)

# --- Cumsum consistency: cumsum(dwilcox) vs pwilcox ---
cumsum_pdf <- cumsum(dwilcox(0:24, 4, 6))
cumsum_cdf <- pwilcox(0:24, 4, 6)

# --- m=3, n=3 ---
m3n3_x <- c(0, 2, 4, 6, 9)
m3n3_pdf <- dwilcox(m3n3_x, 3, 3)
m3n3_cdf <- pwilcox(m3n3_x, 3, 3)

# --- Upper tail ---
upper_tail <- pwilcox(10, 4, 6, lower.tail = FALSE)

# --- Log ---
log_pdf <- dwilcox(5, 4, 6, log = TRUE)
log_cdf <- pwilcox(5, 4, 6, log.p = TRUE)

# --- p-q round trip (discrete: use fudge) ---
rt_x <- c(2, 5, 10, 15, 20)
f1 <- 1 - 1e-7
rt_result <- qwilcox(pwilcox(rt_x, 4, 6) * f1, 4, 6)

emit_reference(list(
  m4n6_pdf = m4n6_pdf,
  m4n6_cdf = m4n6_cdf,
  m4n6_quantile = m4n6_quantile,
  sym_46 = sym_46,
  sym_64 = sym_64,
  cumsum_pdf = cumsum_pdf,
  cumsum_cdf = cumsum_cdf,
  m3n3_pdf = m3n3_pdf,
  m3n3_cdf = m3n3_cdf,
  upper_tail = upper_tail,
  log_pdf = log_pdf,
  log_cdf = log_cdf,
  rt_x = rt_x,
  rt_result = rt_result
))
