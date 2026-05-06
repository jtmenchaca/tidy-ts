# Companion R script for reg-tests-2.R
# Extracts portable hypothesis test cases and emits reference values as JSON.
cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "../..", "r-json-emit.R"))

# -- L2418-2429: cor.test Kendall and Spearman with all three alternatives --
x <- c(1, 2, 3, 4, 5)
y <- c(8, 6, 7, 5, 3)

kt_two <- cor.test(x, y, method = "kendall")
kt_less <- cor.test(x, y, method = "kendall", alternative = "less")
kt_greater <- cor.test(x, y, method = "kendall", alternative = "greater")

sp_two <- cor.test(x, y, method = "spearman")
sp_less <- cor.test(x, y, method = "spearman", alternative = "less")
sp_greater <- cor.test(x, y, method = "spearman", alternative = "greater")

# -- L3199: t.test(1:28) -- basic correctness --
tt <- t.test(1:28)

emit_reference(list(
  cor_x = x,
  cor_y = y,

  # Kendall
  kendall_two_tau = as.numeric(kt_two$estimate),
  kendall_two_p = kt_two$p.value,
  kendall_less_p = kt_less$p.value,
  kendall_greater_p = kt_greater$p.value,

  # Spearman
  spearman_two_rho = as.numeric(sp_two$estimate),
  spearman_two_p = sp_two$p.value,
  spearman_less_p = sp_less$p.value,
  spearman_greater_p = sp_greater$p.value,

  # t.test
  ttest_statistic = as.numeric(tt$statistic),
  ttest_p_value = tt$p.value,
  ttest_mean = as.numeric(tt$estimate),
  ttest_ci_lower = tt$conf.int[1],
  ttest_ci_upper = tt$conf.int[2]
))
