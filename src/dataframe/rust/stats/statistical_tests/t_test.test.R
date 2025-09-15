#!/usr/bin/env Rscript

# R script for t-test comparisons
# Usage: Rscript t_test.test.R <function_name> <args...>

source("test-helpers.R")

# Define t-test functions
t_test_one_sample <- function(data_json, mu, alternative, alpha) {
  data <- parse_json_array(data_json)
  result <- t.test(data, mu = as.numeric(mu), alternative = alternative, conf.level = 1 - as.numeric(alpha))
  
  list(
    test_statistic = as.numeric(result$statistic),
    p_value = result$p.value,
    confidence_interval_lower = result$conf.int[1],
    confidence_interval_upper = result$conf.int[2],
    reject_null = result$p.value < as.numeric(alpha)
  )
}

t_test_two_sample <- function(data1_json, data2_json, alternative, alpha) {
  data1 <- parse_json_array(data1_json)
  data2 <- parse_json_array(data2_json)
  result <- t.test(data1, data2, alternative = alternative, conf.level = 1 - as.numeric(alpha))
  
  list(
    test_statistic = as.numeric(result$statistic),
    p_value = result$p.value,
    confidence_interval_lower = result$conf.int[1],
    confidence_interval_upper = result$conf.int[2],
    reject_null = result$p.value < as.numeric(alpha)
  )
}

t_test_paired <- function(data1_json, data2_json, alternative, alpha) {
  data1 <- parse_json_array(data1_json)
  data2 <- parse_json_array(data2_json)
  result <- t.test(data1, data2, alternative = alternative, conf.level = 1 - as.numeric(alpha), paired = TRUE)
  
  list(
    test_statistic = as.numeric(result$statistic),
    p_value = result$p.value,
    confidence_interval_lower = result$conf.int[1],
    confidence_interval_upper = result$conf.int[2],
    reject_null = result$p.value < as.numeric(alpha)
  )
}

# Override the call function for t-tests
call_stat_test_function <- function(args, test_functions) {
  switch(args$func,
    "t.test.one" = t_test_one_sample(args$args[1], args$args[2], args$args[3], args$args[4]),
    "t.test.two" = t_test_two_sample(args$args[1], args$args[2], args$args[3], args$args[4]),
    "t.test.paired" = t_test_paired(args$args[1], args$args[2], args$args[3], args$args[4]),
    NA
  )
}

# Run the test
run_stat_test(NULL)
