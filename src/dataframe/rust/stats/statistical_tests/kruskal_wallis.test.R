#!/usr/bin/env Rscript

# R script for Kruskal-Wallis test comparisons
# Usage: Rscript kruskal_wallis.test.R <function_name> <args...>

source("test-helpers.R")

# Define Kruskal-Wallis test function
kruskal_wallis_test_one <- function(groups_json, alpha) {
  groups <- jsonlite::fromJSON(groups_json, simplifyMatrix = FALSE)
  
  # Convert to long format for R
  values <- c()
  group_labels <- c()
  
  for (i in seq_along(groups)) {
    group_data <- groups[[i]]
    values <- c(values, group_data)
    group_labels <- c(group_labels, rep(i, length(group_data)))
  }
  
  # Create data frame
  df <- data.frame(value = values, group = group_labels)
  
  # Perform Kruskal-Wallis test
  result <- kruskal.test(value ~ as.factor(group), data = df)
  
  list(
    test_statistic = as.numeric(result$statistic),
    p_value = result$p.value,
    reject_null = result$p.value < as.numeric(alpha)
  )
}

# Override the call function for Kruskal-Wallis tests
call_stat_test_function <- function(args, test_functions) {
  switch(args$func,
    "kruskal.test.one" = kruskal_wallis_test_one(args$args[1], args$args[2]),
    NA
  )
}

# Run the test
run_stat_test(NULL)
