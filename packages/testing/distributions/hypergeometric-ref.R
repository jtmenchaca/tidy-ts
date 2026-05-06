#!/usr/bin/env Rscript

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "../statistical_tests/source-tests/r-json-emit.R"))

# --- m=10, n=7, k=8 ---
x1 <- c(0, 1, 3, 5, 8)
p1 <- c(0.1, 0.25, 0.5, 0.75, 0.9)

dhyper_m10n7k8 <- dhyper(x1, m = 10, n = 7, k = 8)
phyper_m10n7k8 <- phyper(x1, m = 10, n = 7, k = 8)
qhyper_m10n7k8 <- qhyper(p1, m = 10, n = 7, k = 8)

# --- m=20, n=30, k=15 ---
x2 <- c(0, 3, 6, 9, 12)
p2 <- c(0.1, 0.5, 0.9)

dhyper_m20n30k15 <- dhyper(x2, m = 20, n = 30, k = 15)
phyper_m20n30k15 <- phyper(x2, m = 20, n = 30, k = 15)
qhyper_m20n30k15 <- qhyper(p2, m = 20, n = 30, k = 15)

# --- Upper tail ---
phyper_upper <- phyper(3, m = 10, n = 7, k = 8, lower.tail = FALSE)

# --- Log ---
dhyper_log <- dhyper(3, m = 10, n = 7, k = 8, log = TRUE)

# --- Cumsum consistency ---
cumsum_dhyper <- cumsum(dhyper(0:8, m = 10, n = 7, k = 8))
phyper_0_8 <- phyper(0:8, m = 10, n = 7, k = 8)
cumsum_matches <- all(abs(cumsum_dhyper - phyper_0_8) < 1e-14)

# --- Log CDF ---
phyper_log <- phyper(3, m = 10, n = 7, k = 8, log.p = TRUE)

# --- p-q round trip (discrete: use fudge) ---
rt_x <- c(1, 3, 5, 7)
f1 <- 1 - 1e-7
rt_result <- qhyper(phyper(rt_x, m = 10, n = 7, k = 8) * f1, m = 10, n = 7, k = 8)

emit_reference(list(
  dhyper_m10n7k8 = dhyper_m10n7k8,
  phyper_m10n7k8 = phyper_m10n7k8,
  qhyper_m10n7k8 = qhyper_m10n7k8,
  dhyper_m20n30k15 = dhyper_m20n30k15,
  phyper_m20n30k15 = phyper_m20n30k15,
  qhyper_m20n30k15 = qhyper_m20n30k15,
  phyper_upper = phyper_upper,
  dhyper_log = dhyper_log,
  cumsum_dhyper = cumsum_dhyper,
  phyper_0_8 = phyper_0_8,
  cumsum_matches = cumsum_matches,
  phyper_log = phyper_log,
  rt_x = rt_x,
  rt_result = rt_result
))
