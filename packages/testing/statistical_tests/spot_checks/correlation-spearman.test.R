#!/usr/bin/env Rscript

cat("\n📊 Spearman Correlation Test\n")
cat(paste(rep("-", 80), collapse = ""), "\n")

x <- c(1.5, 2.3, 3.1, 4.2, 5.0, 6.1, 7.3, 8.5)
y <- c(2.1, 3.5, 4.2, 5.8, 6.5, 7.9, 9.1, 10.2)

# Spearman correlation test
result <- cor.test(x, y, method = "spearman", alternative = "two.sided", exact = FALSE)

cat("x:", x, "\n")
cat("y:", y, "\n")
cat("Spearman rho:", result$estimate, "\n")
cat("S statistic:", result$statistic, "\n")
cat("p-value:", result$p.value, "\n")

cat("\n", paste(rep("=", 80), collapse = ""), "\n")
cat("SPEARMAN CORRELATION TEST SPOT CHECK\n")
cat(paste(rep("=", 80), collapse = ""), "\n")
