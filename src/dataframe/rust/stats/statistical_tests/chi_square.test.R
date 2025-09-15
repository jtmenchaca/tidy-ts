#!/usr/bin/env Rscript

# R script for Chi-square test comparisons
# Usage: Rscript chi_square.test.R <function_name> <args...>

args <- commandArgs(trailingOnly = TRUE)

if (length(args) < 1) {
  stop("Function name required")
}

function_name <- args[1]

if (function_name == "chisq.test.independence") {
  # Chi-square test of independence
  contingency_table <- jsonlite::fromJSON(args[2])
  
  # Convert to matrix (fromJSON already gives us a matrix for 2D arrays)
  matrix_data <- as.matrix(contingency_table)
  
  # Perform chi-square test
  result <- chisq.test(matrix_data)
  
  cat(jsonlite::toJSON(list(
    test_statistic = result$statistic,
    p_value = result$p.value,
    reject_null = result$p.value < 0.05
  ), auto_unbox = TRUE))
  
} else {
  stop(paste("Unknown function:", function_name))
}
