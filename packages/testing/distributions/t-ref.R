#!/usr/bin/env Rscript

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "../statistical_tests/source-tests/r-json-emit.R"))

# --- df=5: dt ---
df5_x <- c(-3, -1, 0, 1, 3)
df5_dt <- dt(df5_x, df = 5)

# --- df=5: pt ---
df5_pt <- pt(df5_x, df = 5)

# --- df=5: qt ---
df5_qt_p <- c(0.025, 0.05, 0.5, 0.95, 0.975)
df5_qt <- qt(df5_qt_p, df = 5)

# --- df=1 (Cauchy): dt, pt ---
df1_x <- c(-2, 0, 2)
df1_dt <- dt(df1_x, df = 1)
df1_pt <- pt(df1_x, df = 1)

# --- df=30: dt, pt ---
df30_x <- c(-2, 0, 2)
df30_dt <- dt(df30_x, df = 30)
df30_pt <- pt(df30_x, df = 30)

# --- Upper tail ---
upper_tail <- pt(1.96, df = 100, lower.tail = FALSE)

# --- Log ---
log_dt <- dt(0, df = 5, log = TRUE)

# --- Symmetry: qt(0.5, df=...) should all be 0 ---
symmetry_dfs <- c(1, 2, 4, 10, 100)
symmetry_qt <- qt(0.5, df = symmetry_dfs)

# --- Extreme tails ---
extreme_qt_p <- c(1e-10, 1e-20, 1e-50)
extreme_qt <- qt(extreme_qt_p, df = 1)

# --- dt at extreme x (should not be -Inf in log) ---
log_dt_extreme <- dt(1e155, df = 5, log = TRUE)

# --- Log CDF ---
log_pt <- pt(1.96, df = 5, log.p = TRUE)

# --- p-q round trip ---
rt_x <- c(-2, -0.5, 0, 0.5, 2)
rt_result <- qt(pt(rt_x, df = 5), df = 5)

emit_reference(list(
  df5_x = df5_x,
  df5_dt = df5_dt,
  df5_pt = df5_pt,
  df5_qt_p = df5_qt_p,
  df5_qt = df5_qt,
  df1_x = df1_x,
  df1_dt = df1_dt,
  df1_pt = df1_pt,
  df30_x = df30_x,
  df30_dt = df30_dt,
  df30_pt = df30_pt,
  upper_tail = upper_tail,
  log_dt = log_dt,
  symmetry_dfs = symmetry_dfs,
  symmetry_qt = symmetry_qt,
  extreme_qt_p = extreme_qt_p,
  extreme_qt = extreme_qt,
  log_dt_extreme = log_dt_extreme,
  log_pt = log_pt,
  rt_x = rt_x,
  rt_result = rt_result
))
