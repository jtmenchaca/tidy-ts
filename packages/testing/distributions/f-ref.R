#!/usr/bin/env Rscript

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "../statistical_tests/source-tests/r-json-emit.R"))

# --- df1=5, df2=10 ---
x1 <- c(0.5, 1, 2, 3, 5)
p1 <- c(0.05, 0.1, 0.5, 0.9, 0.95)

pdf_5_10 <- df(x1, df1 = 5, df2 = 10)
cdf_5_10 <- pf(x1, df1 = 5, df2 = 10)
quantile_5_10 <- qf(p1, df1 = 5, df2 = 10)

# --- df1=1, df2=5 ---
x2 <- c(0.1, 1, 5)
p2 <- c(0.5, 0.9, 0.95)

pdf_1_5 <- df(x2, df1 = 1, df2 = 5)
cdf_1_5 <- pf(x2, df1 = 1, df2 = 5)
quantile_1_5 <- qf(p2, df1 = 1, df2 = 5)

# --- Upper tail ---
upper_tail <- pf(4.0, df1 = 2, df2 = 20, lower.tail = FALSE)

# --- Log scale ---
log_pdf <- df(1, df1 = 5, df2 = 10, log = TRUE)

# --- Edge cases ---
edge_df1_1 <- df(0, df1 = 1, df2 = 5)   # Inf
edge_df1_2 <- df(0, df1 = 2, df2 = 5)   # 1
edge_df1_3 <- df(0, df1 = 3, df2 = 5)   # 0

# --- p-q round trip (df1=12, df2=6) ---
rt_x <- c(0.5, 1, 2, 5)
rt_result <- qf(pf(rt_x, 12, 6), 12, 6)

emit_reference(list(
  pdf_5_10 = pdf_5_10,
  cdf_5_10 = cdf_5_10,
  quantile_5_10 = quantile_5_10,
  pdf_1_5 = pdf_1_5,
  cdf_1_5 = cdf_1_5,
  quantile_1_5 = quantile_1_5,
  upper_tail = upper_tail,
  log_pdf = log_pdf,
  edge_df1_1 = edge_df1_1,
  edge_df1_2 = edge_df1_2,
  edge_df1_3 = edge_df1_3,
  rt_x = rt_x,
  rt_result = rt_result
))
