#!/usr/bin/env Rscript

# R script for Fisher's exact test comparisons
# Usage: Rscript fishers_exact.test.R <function_name> <args...>

source("test-helpers.R")

# Define Fisher's exact test function
fishers_exact_test_one <- function(contingency_table_json) {
  contingency_table <- jsonlite::fromJSON(contingency_table_json, simplifyMatrix = FALSE)
  
  # Convert to matrix
  matrix_data <- do.call(rbind, contingency_table)
  
  # Perform Fisher's exact test
  result <- fisher.test(matrix_data)
  
  list(
    p_value = result$p.value,
    reject_null = result$p.value < 0.05
  )
}

# Override the call function for Fisher's exact tests
call_stat_test_function <- function(args, test_functions) {
  switch(args$func,
    "fisher.test.exact" = fishers_exact_test_one(args$args[1]),
    NA
  )
}

# Run the test
run_stat_test(NULL)
