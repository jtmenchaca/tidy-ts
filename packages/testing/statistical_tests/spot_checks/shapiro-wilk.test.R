#!/usr/bin/env Rscript

cat("\n📊 Shapiro-Wilk Normality Test\n")
cat(paste(rep("-", 80), collapse = ""), "\n")

data <- c(2.5, 3.1, 2.8, 3.3, 2.9, 3.0, 2.7, 3.2)

# Shapiro-Wilk test
result <- shapiro.test(data)

cat("Data:", data, "\n")
cat("W-statistic:", result$statistic, "\n")
cat("p-value:", result$p.value, "\n")

cat("\n", paste(rep("=", 80), collapse = ""), "\n")
cat("SHAPIRO-WILK NORMALITY TEST SPOT CHECK\n")
cat(paste(rep("=", 80), collapse = ""), "\n")
