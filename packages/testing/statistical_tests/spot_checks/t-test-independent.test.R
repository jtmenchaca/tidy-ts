#!/usr/bin/env Rscript

cat("\n📊 Independent (Two-Sample) T-Test\n")
cat(paste(rep("-", 80), collapse = ""), "\n")

library(effsize)

group1 <- c(23.5, 24.1, 22.8, 23.9, 24.3)
group2 <- c(21.2, 20.7, 21.8, 20.9, 21.5)

# Independent t-test (assuming equal variances)
result <- t.test(group1, group2, alternative = "two.sided", var.equal = TRUE, conf.level = 0.95)

# Cohen's d for independent samples
cohens_d <- cohen.d(group1, group2, pooled = TRUE, paired = FALSE)

cat("Group 1:", group1, "\n")
cat("Group 2:", group2, "\n")
cat("t-statistic:", result$statistic, "\n")
cat("df:", result$parameter, "\n")
cat("p-value:", result$p.value, "\n")
cat("CI lower:", result$conf.int[1], "\n")
cat("CI upper:", result$conf.int[2], "\n")
cat("Cohen's d:", cohens_d$estimate, "\n")

cat("\n", paste(rep("=", 80), collapse = ""), "\n")
cat("INDEPENDENT T-TEST SPOT CHECK\n")
cat(paste(rep("=", 80), collapse = ""), "\n")
