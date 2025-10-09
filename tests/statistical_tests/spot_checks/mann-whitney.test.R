#!/usr/bin/env Rscript

cat("\n📊 Mann-Whitney U Test\n")
cat(paste(rep("-", 80), collapse = ""), "\n")

group1 <- c(14, 15, 16, 17, 18)
group2 <- c(20, 21, 22, 23, 24)

# Mann-Whitney U test (Wilcoxon rank-sum test)
result <- wilcox.test(group1, group2, alternative = "two.sided", conf.level = 0.95)

cat("Group 1:", group1, "\n")
cat("Group 2:", group2, "\n")
cat("W-statistic:", result$statistic, "\n")
cat("p-value:", result$p.value, "\n")

cat("\n", paste(rep("=", 80), collapse = ""), "\n")
cat("MANN-WHITNEY U TEST SPOT CHECK\n")
cat(paste(rep("=", 80), collapse = ""), "\n")
