#!/usr/bin/env Rscript

cat("\n📊 Fisher's Exact Test\n")
cat(paste(rep("-", 80), collapse = ""), "\n")

contingency_table <- matrix(c(8, 2, 1, 5), nrow = 2, byrow = TRUE)

# Fisher's exact test
result <- fisher.test(contingency_table, alternative = "two.sided", conf.level = 0.95)

cat("Contingency Table: [[8, 2], [1, 5]]\n")
cat("Odds ratio (MLE):", result$estimate, "\n")
cat("p-value:", result$p.value, "\n")
cat("CI lower:", result$conf.int[1], "\n")
cat("CI upper:", result$conf.int[2], "\n")

cat("\n", paste(rep("=", 80), collapse = ""), "\n")
cat("FISHER'S EXACT TEST SPOT CHECK\n")
cat(paste(rep("=", 80), collapse = ""), "\n")
