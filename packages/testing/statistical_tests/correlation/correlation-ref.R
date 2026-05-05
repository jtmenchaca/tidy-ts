#!/usr/bin/env Rscript

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "..", "r-json-emit.R"))

# Fixed data
x <- c(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
y <- c(2.1, 3.9, 6.2, 7.8, 10.1, 12.0, 14.2, 15.9, 18.1, 20.0)

# --- Scenario 1: pearson_two ---
res1 <- cor.test(x, y, method = "pearson", alternative = "two.sided")

# --- Scenario 2: pearson_greater ---
res2 <- cor.test(x, y, method = "pearson", alternative = "greater")

# --- Scenario 3: spearman_two ---
res3 <- cor.test(x, y, method = "spearman", alternative = "two.sided")

# --- Scenario 4: spearman_less ---
res4 <- cor.test(x, y, method = "spearman", alternative = "less")

# --- Scenario 5: kendall_two ---
res5 <- cor.test(x, y, method = "kendall", alternative = "two.sided")

# --- Scenario 6: kendall_greater ---
res6 <- cor.test(x, y, method = "kendall", alternative = "greater")

# --- Scenario 7: weak_correlation ---
x2 <- c(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
y2 <- c(5, 3, 7, 2, 8, 4, 9, 1, 6, 10)
res7 <- cor.test(x2, y2, method = "pearson", alternative = "two.sided")

# --- Scenario 8: negative_correlation ---
x3 <- c(1, 2, 3, 4, 5)
y3 <- c(10, 8, 6, 4, 2)
res8 <- cor.test(x3, y3, method = "pearson", alternative = "two.sided")

emit_reference(list(
  pearson_two_statistic = unname(res1$statistic),
  pearson_two_pValue = res1$p.value,
  pearson_two_estimate = unname(res1$estimate),
  pearson_two_conf_int = as.vector(res1$conf.int),

  pearson_greater_statistic = unname(res2$statistic),
  pearson_greater_pValue = res2$p.value,
  pearson_greater_estimate = unname(res2$estimate),
  pearson_greater_conf_int = as.vector(res2$conf.int),

  spearman_two_statistic = unname(res3$statistic),
  spearman_two_pValue = res3$p.value,
  spearman_two_estimate = unname(res3$estimate),

  spearman_less_statistic = unname(res4$statistic),
  spearman_less_pValue = res4$p.value,
  spearman_less_estimate = unname(res4$estimate),

  kendall_two_statistic = unname(res5$statistic),
  kendall_two_pValue = res5$p.value,
  kendall_two_estimate = unname(res5$estimate),

  kendall_greater_statistic = unname(res6$statistic),
  kendall_greater_pValue = res6$p.value,
  kendall_greater_estimate = unname(res6$estimate),

  weak_correlation_statistic = unname(res7$statistic),
  weak_correlation_pValue = res7$p.value,
  weak_correlation_estimate = unname(res7$estimate),
  weak_correlation_conf_int = as.vector(res7$conf.int),

  negative_correlation_statistic = unname(res8$statistic),
  negative_correlation_pValue = res8$p.value,
  negative_correlation_estimate = unname(res8$estimate),
  negative_correlation_conf_int = as.vector(res8$conf.int)
))
