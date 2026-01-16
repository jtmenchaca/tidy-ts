#!/usr/bin/env Rscript

cat("\n📊 Kruskal-Wallis Test\n")
cat(paste(rep("-", 80), collapse = ""), "\n")

group1 <- c(2.9, 3.0, 2.5, 2.6, 3.2)
group2 <- c(3.8, 2.7, 4.0, 2.4, 2.8)
group3 <- c(2.8, 3.4, 3.7, 2.2, 2.0)

values <- c(group1, group2, group3)
groups <- factor(c(rep(1, 5), rep(2, 5), rep(3, 5)))

# Kruskal-Wallis test
result <- kruskal.test(values ~ groups)

cat("Groups: [[", paste(group1, collapse = ", "), "], [", paste(group2, collapse = ", "), "], [", paste(group3, collapse = ", "), "]]\n")
cat("H-statistic:", result$statistic, "\n")
cat("df:", result$parameter, "\n")
cat("p-value:", result$p.value, "\n")

cat("\n", paste(rep("=", 80), collapse = ""), "\n")
cat("KRUSKAL-WALLIS TEST SPOT CHECK\n")
cat(paste(rep("=", 80), collapse = ""), "\n")
