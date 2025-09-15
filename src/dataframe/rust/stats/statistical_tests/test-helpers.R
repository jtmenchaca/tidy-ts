#!/usr/bin/env Rscript

# Shared test helpers for statistical test functions
# This file provides common argument parsing and function calling utilities

# Parse command line arguments for statistical tests
# Returns a list with parsed arguments
parse_stat_test_args <- function() {
  args <- commandArgs(trailingOnly = TRUE)
  
  if (length(args) < 1) {
    stop("Usage: Rscript <test>.test.R <function> <args...>")
  }
  
  func <- args[1]
  
  list(
    func = func,
    args = args[-1] # All arguments except the first one
  )
}

# Helper function to parse JSON array string to numeric vector
parse_json_array <- function(json_str) {
  # Remove brackets and split by comma
  cleaned <- gsub("^\\[|\\]$", "", json_str)
  as.numeric(strsplit(cleaned, ",")[[1]])
}

# Call the appropriate statistical test function based on parsed arguments
call_stat_test_function <- function(args, test_functions) {
  switch(args$func,
    # Add test function calls here - will be implemented per test file
    NA
  )
}

# Main execution function for statistical tests
run_stat_test <- function(test_functions) {
  args <- parse_stat_test_args()
  result <- call_stat_test_function(args, test_functions)
  
  # Output as JSON for consistent parsing
  if (!is.null(result) && !any(is.na(result))) {
    cat(jsonlite::toJSON(result, auto_unbox = TRUE))
  } else {
    cat("null")
  }
}