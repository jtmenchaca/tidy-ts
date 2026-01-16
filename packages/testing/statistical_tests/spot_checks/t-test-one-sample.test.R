#!/usr/bin/env Rscript

cat("\n📊 One-Sample T-Test\n")
cat(paste(rep("-", 80), collapse = ""), "\n")

library(effsize)

data <- c(12.5, 13.1, 11.8, 12.9, 13.3, 12.2, 12.7, 13.0)
mu <- 12.0

# One-sample t-test
result <- t.test(data, mu = mu, alternative = "two.sided", conf.level = 0.95)

# Cohen's d for one-sample test
cohens_d <- cohen.d(data, NA, mu = mu)

cat("Data:", data, "\n")
cat("mu (null hypothesis):", mu, "\n")
cat("t-statistic:", result$statistic, "\n")
cat("df:", result$parameter, "\n")
cat("p-value:", result$p.value, "\n")
cat("CI lower:", result$conf.int[1], "\n")
cat("CI upper:", result$conf.int[2], "\n")
cat("Cohen's d:", cohens_d$estimate, "\n")

cat("\n", paste(rep("=", 80), collapse = ""), "\n")
cat("ONE-SAMPLE T-TEST SPOT CHECK\n")
cat(paste(rep("=", 80), collapse = ""), "\n")
