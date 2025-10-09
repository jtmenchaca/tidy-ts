#!/usr/bin/env Rscript

cat("\n📊 Chi-Square Test of Independence\n")
cat(paste(rep("-", 80), collapse = ""), "\n")

contingency_table <- matrix(c(10, 20, 30, 15, 25, 35), nrow = 2, byrow = TRUE)

# Chi-square test
result <- chisq.test(contingency_table)

cat("Contingency Table:\n")
print(contingency_table)
cat("\nChi-squared statistic:", result$statistic, "\n")
cat("df:", result$parameter, "\n")
cat("p-value:", result$p.value, "\n")

cat("\n", paste(rep("=", 80), collapse = ""), "\n")
cat("CHI-SQUARE TEST SPOT CHECK\n")
cat(paste(rep("=", 80), collapse = ""), "\n")
