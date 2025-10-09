#!/usr/bin/env Rscript

cat("\n📊 Wilcoxon Signed-Rank Test\n")
cat(paste(rep("-", 80), collapse = ""), "\n")

library(effsize)

before <- c(125, 115, 130, 140, 140, 115, 140, 125)
after <- c(110, 122, 125, 120, 140, 124, 123, 137)

# Wilcoxon signed-rank test
result <- wilcox.test(before, after, paired = TRUE, alternative = "two.sided", conf.level = 0.95)

# Cohen's d for effect size
cohens_d <- cohen.d(before, after, paired = TRUE, within = FALSE)

cat("Before:", before, "\n")
cat("After:", after, "\n")
cat("V-statistic:", result$statistic, "\n")
cat("p-value:", result$p.value, "\n")
cat("Effect size (Cohen's d):", cohens_d$estimate, "\n")

cat("\n", paste(rep("=", 80), collapse = ""), "\n")
cat("WILCOXON SIGNED-RANK TEST SPOT CHECK\n")
cat(paste(rep("=", 80), collapse = ""), "\n")
