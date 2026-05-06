#!/usr/bin/env Rscript

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "../statistical_tests/source-tests/r-json-emit.R"))

# --- shape=2, scale=1 ---
x1 <- c(0.5, 1, 1.5, 2, 3)
p1 <- c(0.1, 0.25, 0.5, 0.75, 0.9)

pdf_2_1 <- dweibull(x1, shape = 2, scale = 1)
cdf_2_1 <- pweibull(x1, shape = 2, scale = 1)
quantile_2_1 <- qweibull(p1, shape = 2, scale = 1)

# --- shape=0.5, scale=2 ---
x2 <- c(0.1, 0.5, 1, 3, 5)
p2 <- c(0.1, 0.5, 0.9)

pdf_05_2 <- dweibull(x2, shape = 0.5, scale = 2)
cdf_05_2 <- pweibull(x2, shape = 0.5, scale = 2)
quantile_05_2 <- qweibull(p2, shape = 0.5, scale = 2)

# --- Upper tail ---
upper_tail <- pweibull(1, shape = 2, scale = 1, lower.tail = FALSE)

# --- Log scale ---
log_pdf <- dweibull(1, shape = 2, scale = 1, log = TRUE)
log_cdf <- pweibull(1, shape = 2, scale = 1, log.p = TRUE)

# --- Edge cases ---
edge_shape_2 <- dweibull(0, shape = 2, scale = 1)    # 0
edge_shape_1 <- dweibull(0, shape = 1, scale = 1)    # 1
edge_shape_05 <- dweibull(0, shape = 0.5, scale = 1) # Inf

# --- p-q round trip (shape=3, scale=2) ---
rt_x <- c(0.5, 1, 1.5, 2, 3)
rt_result <- qweibull(pweibull(rt_x, shape = 3, scale = 2), shape = 3, scale = 2)

emit_reference(list(
  pdf_2_1 = pdf_2_1,
  cdf_2_1 = cdf_2_1,
  quantile_2_1 = quantile_2_1,
  pdf_05_2 = pdf_05_2,
  cdf_05_2 = cdf_05_2,
  quantile_05_2 = quantile_05_2,
  upper_tail = upper_tail,
  log_pdf = log_pdf,
  log_cdf = log_cdf,
  edge_shape_2 = edge_shape_2,
  edge_shape_1 = edge_shape_1,
  edge_shape_05 = edge_shape_05,
  rt_x = rt_x,
  rt_result = rt_result
))
