#!/usr/bin/env Rscript

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "../statistical_tests/source-tests/r-json-emit.R"))

# --- df=5: dchisq ---
df5_x <- c(1, 2, 3, 5, 10)
df5_dchisq <- dchisq(df5_x, df = 5)

# --- df=5: pchisq ---
df5_pchisq <- pchisq(df5_x, df = 5)

# --- df=5: qchisq ---
df5_qchisq_p <- c(0.05, 0.1, 0.5, 0.9, 0.95)
df5_qchisq <- qchisq(df5_qchisq_p, df = 5)

# --- df=1: dchisq, pchisq ---
df1_x <- c(0.1, 0.5, 1, 3)
df1_dchisq <- dchisq(df1_x, df = 1)
df1_pchisq <- pchisq(df1_x, df = 1)

# --- df=1: qchisq ---
df1_qchisq_p <- c(0.5, 0.9, 0.95)
df1_qchisq <- qchisq(df1_qchisq_p, df = 1)

# --- Upper tail ---
upper_tail <- pchisq(3.84, df = 1, lower.tail = FALSE)

# --- Log ---
log_dchisq <- dchisq(1, df = 5, log = TRUE)

# --- Edge: dchisq(0, df=...) ---
edge_dchisq_0_df1 <- dchisq(0, df = 1)   # Inf
edge_dchisq_0_df2 <- dchisq(0, df = 2)   # 0.5
edge_dchisq_0_df3 <- dchisq(0, df = 3)   # 0

# --- Edge: pchisq(x, df=0) — point mass at 0 ---
pchisq_df0_x <- c(-1, 0, 0.5, 1)
pchisq_df0 <- pchisq(pchisq_df0_x, df = 0)

# --- Edge: dchisq(x, df=0) ---
dchisq_df0_x <- c(-1, 0, 0.5, 1)
dchisq_df0 <- dchisq(dchisq_df0_x, df = 0)

# --- Log CDF ---
log_pchisq <- pchisq(3, df = 5, log.p = TRUE)

# --- p-q round trip ---
rt_x <- c(1, 3, 5, 10)
rt_result <- qchisq(pchisq(rt_x, df = 5), df = 5)

emit_reference(list(
  df5_x = df5_x,
  df5_dchisq = df5_dchisq,
  df5_pchisq = df5_pchisq,
  df5_qchisq_p = df5_qchisq_p,
  df5_qchisq = df5_qchisq,
  df1_x = df1_x,
  df1_dchisq = df1_dchisq,
  df1_pchisq = df1_pchisq,
  df1_qchisq_p = df1_qchisq_p,
  df1_qchisq = df1_qchisq,
  upper_tail = upper_tail,
  log_dchisq = log_dchisq,
  edge_dchisq_0_df1 = edge_dchisq_0_df1,
  edge_dchisq_0_df2 = edge_dchisq_0_df2,
  edge_dchisq_0_df3 = edge_dchisq_0_df3,
  pchisq_df0_x = pchisq_df0_x,
  pchisq_df0 = pchisq_df0,
  dchisq_df0_x = dchisq_df0_x,
  dchisq_df0 = dchisq_df0,
  log_pchisq = log_pchisq,
  rt_x = rt_x,
  rt_result = rt_result
))
