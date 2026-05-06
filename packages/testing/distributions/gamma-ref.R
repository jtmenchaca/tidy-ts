#!/usr/bin/env Rscript

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "../statistical_tests/source-tests/r-json-emit.R"))

# --- shape=2, rate=1 ---
x1 <- c(0.5, 1, 2, 3, 5)
p1 <- c(0.1, 0.25, 0.5, 0.75, 0.9)

dgamma_s2r1 <- dgamma(x1, shape = 2, rate = 1)
pgamma_s2r1 <- pgamma(x1, shape = 2, rate = 1)
qgamma_s2r1 <- qgamma(p1, shape = 2, rate = 1)

# --- shape=0.5, rate=2 ---
x2 <- c(0.1, 0.5, 1, 2)
p2 <- c(0.1, 0.5, 0.9)

dgamma_s05r2 <- dgamma(x2, shape = 0.5, rate = 2)
pgamma_s05r2 <- pgamma(x2, shape = 0.5, rate = 2)
qgamma_s05r2 <- qgamma(p2, shape = 0.5, rate = 2)

# --- Upper tail ---
pgamma_upper <- pgamma(2, shape = 2, rate = 1, lower.tail = FALSE)

# --- Log ---
dgamma_log <- dgamma(1, shape = 2, rate = 1, log = TRUE)
pgamma_log <- pgamma(1, shape = 2, rate = 1, log.p = TRUE)

# --- Edge cases at x=0 ---
dgamma_zero_shape05 <- dgamma(0, shape = 0.5, rate = 1)   # Inf
dgamma_zero_shape1  <- dgamma(0, shape = 1, rate = 1)     # rate = 1
dgamma_zero_shape2  <- dgamma(0, shape = 2, rate = 1)     # 0

# --- Small shape ---
qgamma_small_shape <- qgamma(0.5, shape = 1e-10, rate = 1)

# --- p-q round trip (using scale=5, i.e. rate=0.2) ---
rt_x <- c(0.5, 1, 2, 5, 10)
rt_result <- qgamma(pgamma(rt_x, shape = 2, scale = 5), shape = 2, scale = 5)

emit_reference(list(
  dgamma_s2r1 = dgamma_s2r1,
  pgamma_s2r1 = pgamma_s2r1,
  qgamma_s2r1 = qgamma_s2r1,
  dgamma_s05r2 = dgamma_s05r2,
  pgamma_s05r2 = pgamma_s05r2,
  qgamma_s05r2 = qgamma_s05r2,
  pgamma_upper = pgamma_upper,
  dgamma_log = dgamma_log,
  pgamma_log = pgamma_log,
  dgamma_zero_shape05 = dgamma_zero_shape05,
  dgamma_zero_shape1 = dgamma_zero_shape1,
  dgamma_zero_shape2 = dgamma_zero_shape2,
  qgamma_small_shape = qgamma_small_shape,
  rt_x = rt_x,
  rt_result = rt_result
))
