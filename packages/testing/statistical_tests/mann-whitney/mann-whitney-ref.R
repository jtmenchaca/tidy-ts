#!/usr/bin/env Rscript

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "..", "r-json-emit.R"))

# All tests use exact=FALSE, correct=FALSE to match our normal approximation impl

# --- Scenario 1: basic (two clearly different groups, two-sided) ---
x1 <- c(14, 15, 16, 17, 18)
y1 <- c(20, 21, 22, 23, 24)
res1 <- wilcox.test(x1, y1, alternative = "two.sided", exact = FALSE, correct = FALSE)

# --- Scenario 2: one_sided_less ---
res2 <- wilcox.test(x1, y1, alternative = "less", exact = FALSE, correct = FALSE)

# --- Scenario 3: one_sided_greater ---
res3 <- wilcox.test(x1, y1, alternative = "greater", exact = FALSE, correct = FALSE)

# --- Scenario 4: ties ---
x4 <- c(1, 2, 2, 3, 4)
y4 <- c(2, 3, 3, 4, 5)
res4 <- wilcox.test(x4, y4, alternative = "two.sided", exact = FALSE, correct = FALSE)

# --- Scenario 5: large_sample (normal approximation) ---
x5 <- seq(1, 30)
y5 <- seq(5, 34)
res5 <- wilcox.test(x5, y5, alternative = "two.sided", exact = FALSE, correct = FALSE)

# --- Scenario 6: identical_groups ---
x6 <- c(1, 2, 3, 4, 5)
y6 <- c(1, 2, 3, 4, 5)
res6 <- wilcox.test(x6, y6, alternative = "two.sided", exact = FALSE, correct = FALSE)

# --- Scenario 7: single_obs ---
x7 <- c(5)
y7 <- c(1, 2, 3)
res7 <- wilcox.test(x7, y7, alternative = "two.sided", exact = FALSE, correct = FALSE)

emit_reference(list(
  basic_W = unname(res1$statistic),
  basic_pValue = res1$p.value,
  basic_alternative = res1$alternative,
  basic_method = res1$method,

  one_sided_less_W = unname(res2$statistic),
  one_sided_less_pValue = res2$p.value,
  one_sided_less_alternative = res2$alternative,
  one_sided_less_method = res2$method,

  one_sided_greater_W = unname(res3$statistic),
  one_sided_greater_pValue = res3$p.value,
  one_sided_greater_alternative = res3$alternative,
  one_sided_greater_method = res3$method,

  ties_W = unname(res4$statistic),
  ties_pValue = res4$p.value,
  ties_alternative = res4$alternative,
  ties_method = res4$method,

  large_sample_W = unname(res5$statistic),
  large_sample_pValue = res5$p.value,
  large_sample_alternative = res5$alternative,
  large_sample_method = res5$method,

  identical_groups_W = unname(res6$statistic),
  identical_groups_pValue = res6$p.value,
  identical_groups_alternative = res6$alternative,
  identical_groups_method = res6$method,

  single_obs_W = unname(res7$statistic),
  single_obs_pValue = res7$p.value,
  single_obs_alternative = res7$alternative,
  single_obs_method = res7$method
))
