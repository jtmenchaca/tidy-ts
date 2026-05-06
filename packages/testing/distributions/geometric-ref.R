#!/usr/bin/env Rscript

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "../statistical_tests/source-tests/r-json-emit.R"))

# --- prob=0.3 ---
x1 <- c(0, 1, 2, 5, 10)
p1 <- c(0.1, 0.25, 0.5, 0.75, 0.9)

dgeom_p03 <- dgeom(x1, prob = 0.3)
pgeom_p03 <- pgeom(x1, prob = 0.3)
qgeom_p03 <- qgeom(p1, prob = 0.3)

# --- prob=0.8 ---
x2 <- c(0, 1, 2, 3)
p2 <- c(0.1, 0.5, 0.9)

dgeom_p08 <- dgeom(x2, prob = 0.8)
pgeom_p08 <- pgeom(x2, prob = 0.8)
qgeom_p08 <- qgeom(p2, prob = 0.8)

# --- Upper tail ---
pgeom_upper <- pgeom(2, prob = 0.3, lower.tail = FALSE)

# --- Log ---
dgeom_log <- dgeom(0, prob = 0.3, log = TRUE)

# --- Cumsum consistency ---
cumsum_dgeom <- cumsum(dgeom(0:10, 0.3))
pgeom_0_10 <- pgeom(0:10, 0.3)
cumsum_matches <- all(abs(cumsum_dgeom - pgeom_0_10) < 1e-14)

# --- Extreme probabilities ---
pgeom_extreme <- pgeom(c(0, 10, 100, 1000), prob = 0.5)

# --- Log CDF ---
pgeom_log <- pgeom(2, prob = 0.3, log.p = TRUE)

# --- p-q round trip (discrete: use fudge) ---
rt_x <- c(0, 1, 3, 5)
f1 <- 1 - 1e-7
rt_result <- qgeom(pgeom(rt_x, prob = 0.3) * f1, prob = 0.3)

emit_reference(list(
  dgeom_p03 = dgeom_p03,
  pgeom_p03 = pgeom_p03,
  qgeom_p03 = qgeom_p03,
  dgeom_p08 = dgeom_p08,
  pgeom_p08 = pgeom_p08,
  qgeom_p08 = qgeom_p08,
  pgeom_upper = pgeom_upper,
  dgeom_log = dgeom_log,
  cumsum_dgeom = cumsum_dgeom,
  pgeom_0_10 = pgeom_0_10,
  cumsum_matches = cumsum_matches,
  pgeom_extreme = pgeom_extreme,
  pgeom_log = pgeom_log,
  rt_x = rt_x,
  rt_result = rt_result
))
