#!/usr/bin/env Rscript

# R script for Mann-Whitney U test comparisons
# Usage: Rscript mann_whitney.test.R <function_name> <args...>

args <- commandArgs(trailingOnly = TRUE)

if (length(args) < 1) {
  stop("Function name required")
}

function_name <- args[1]

if (function_name == "wilcox.test.mannwhitney") {
  # Mann-Whitney U test (Wilcoxon rank-sum test)
  data1_str <- gsub("^\\[|\\]$", "", args[2])
  data1 <- as.numeric(strsplit(data1_str, ",")[[1]])
  data2_str <- gsub("^\\[|\\]$", "", args[3])
  data2 <- as.numeric(strsplit(data2_str, ",")[[1]])
  alternative <- args[4]
  alpha <- as.numeric(args[5])
  
  # Perform Mann-Whitney U test
  result <- wilcox.test(data1, data2, alternative = alternative, conf.level = 1 - alpha)
  
  cat(jsonlite::toJSON(list(
    test_statistic = result$statistic,
    p_value = result$p.value,
    reject_null = result$p.value < alpha
  ), auto_unbox = TRUE))
  
} else {
  stop(paste("Unknown function:", function_name))
}
