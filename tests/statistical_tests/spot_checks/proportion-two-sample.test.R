#!/usr/bin/env Rscript

cat("\n📊 Two-Sample Proportion Test\n")
cat(paste(rep("-", 80), collapse = ""), "\n")

successes <- c(6, 3)
n <- c(8, 8)

# Two-sample proportion test
result <- prop.test(successes, n, alternative = "two.sided", conf.level = 0.95, correct = TRUE)

cat("Group 1 successes:", successes[1], "/", n[1], "\n")
cat("Group 2 successes:", successes[2], "/", n[2], "\n")
cat("Chi-squared statistic:", result$statistic, "\n")
cat("p-value:", result$p.value, "\n")
cat("CI lower:", result$conf.int[1], "\n")
cat("CI upper:", result$conf.int[2], "\n")
cat("Sample estimates:", result$estimate, "\n")

cat("\n", paste(rep("=", 80), collapse = ""), "\n")
cat("TWO-SAMPLE PROPORTION TEST SPOT CHECK\n")
cat(paste(rep("=", 80), collapse = ""), "\n")
