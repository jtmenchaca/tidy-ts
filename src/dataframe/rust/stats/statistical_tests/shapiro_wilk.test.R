#!/usr/bin/env Rscript

# R script for Shapiro-Wilk test comparisons
# Usage: Rscript shapiro_wilk.test.R <function_name> <args...>

args <- commandArgs(trailingOnly = TRUE)

if (length(args) < 1) {
  stop("Function name required")
}

function_name <- args[1]

if (function_name == "shapiro.test.normality") {
  # Shapiro-Wilk test
  data_str <- gsub("^\\[|\\]$", "", args[2])
  data <- as.numeric(strsplit(data_str, ",")[[1]])
  
  # Perform Shapiro-Wilk test
  result <- shapiro.test(data)
  
  cat(jsonlite::toJSON(list(
    test_statistic = result$statistic,
    p_value = result$p.value,
    reject_null = result$p.value < 0.05
  ), auto_unbox = TRUE))
  
} else {
  stop(paste("Unknown function:", function_name))
}
