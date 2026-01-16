#!/usr/bin/env Rscript

cat("\n📊 One-Sample Proportion Test\n")
cat(paste(rep("-", 80), collapse = ""), "\n")

successes <- 7
n <- 10
p0 <- 0.5

# One-sample proportion test
result <- prop.test(successes, n, p = p0, alternative = "two.sided", conf.level = 0.95, correct = TRUE)

cat("Successes:", successes, "/", n, "\n")
cat("p0 (null hypothesis):", p0, "\n")
cat("Chi-squared statistic:", result$statistic, "\n")
cat("p-value:", result$p.value, "\n")
cat("CI lower:", result$conf.int[1], "\n")
cat("CI upper:", result$conf.int[2], "\n")
cat("Sample estimate:", result$estimate, "\n")

cat("\n", paste(rep("=", 80), collapse = ""), "\n")
cat("ONE-SAMPLE PROPORTION TEST SPOT CHECK\n")
cat(paste(rep("=", 80), collapse = ""), "\n")
