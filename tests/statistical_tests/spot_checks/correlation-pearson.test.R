#!/usr/bin/env Rscript

cat("\n📊 Pearson Correlation Test\n")
cat(paste(rep("-", 80), collapse = ""), "\n")

x <- c(1.5, 2.3, 3.1, 4.2, 5.0, 6.1, 7.3, 8.5)
y <- c(2.1, 3.5, 4.2, 5.8, 6.5, 7.9, 9.1, 10.2)

# Pearson correlation test
result <- cor.test(x, y, method = "pearson", alternative = "two.sided", conf.level = 0.95)

cat("x:", x, "\n")
cat("y:", y, "\n")
cat("Correlation (r):", result$estimate, "\n")
cat("t-statistic:", result$statistic, "\n")
cat("df:", result$parameter, "\n")
cat("p-value:", result$p.value, "\n")
cat("CI lower:", result$conf.int[1], "\n")
cat("CI upper:", result$conf.int[2], "\n")

cat("\n", paste(rep("=", 80), collapse = ""), "\n")
cat("PEARSON CORRELATION TEST SPOT CHECK\n")
cat(paste(rep("=", 80), collapse = ""), "\n")
