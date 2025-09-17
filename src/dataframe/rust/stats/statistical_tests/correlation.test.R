#!/usr/bin/env Rscript

# R script for correlation test comparisons
# Usage: Rscript correlation.test.R <function_name> <args...>

args <- commandArgs(trailingOnly = TRUE)

if (length(args) < 1) {
  stop("Function name required")
}

function_name <- args[1]

if (function_name == "cor.test.pearson" || function_name == "cor.test.spearman" || function_name == "cor.test.kendall") {
  # Correlation test
  x_str <- gsub("^\\[|\\]$", "", args[2])
  x <- as.numeric(strsplit(x_str, ",")[[1]])
  y_str <- gsub("^\\[|\\]$", "", args[3])
  y <- as.numeric(strsplit(y_str, ",")[[1]])
  method <- args[4]
  
  # Perform correlation test
  result <- cor.test(x, y, method = method)
  
  cat(jsonlite::toJSON(list(
    test_statistic = result$statistic,
    p_value = result$p.value,
    correlation = result$estimate,
    reject_null = result$p.value < 0.05
  ), auto_unbox = TRUE))
  
} else {
  stop(paste("Unknown function:", function_name))
}
