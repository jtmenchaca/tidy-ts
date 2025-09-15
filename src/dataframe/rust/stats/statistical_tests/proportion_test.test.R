#!/usr/bin/env Rscript

# R script for proportion test comparisons
# Usage: Rscript proportion_test.test.R <function_name> <args...>

source("test-helpers.R")

# Define proportion test functions
proportion_test_one_sample <- function(data_json, p0, alternative, alpha) {
  data <- parse_json_array(data_json)
  
  # Calculate sample proportion
  successes <- sum(data)
  n <- length(data)
  p_hat <- successes / n
  
  # Calculate z-statistic
  se <- sqrt(as.numeric(p0) * (1 - as.numeric(p0)) / n)
  z_stat <- (p_hat - as.numeric(p0)) / se
  
  # Calculate p-value
  if (alternative == "two.sided") {
    p_value <- 2 * (1 - pnorm(abs(z_stat)))
  } else if (alternative == "less") {
    p_value <- pnorm(z_stat)
  } else {
    p_value <- 1 - pnorm(z_stat)
  }
  
  # Calculate confidence interval
  alpha_val <- as.numeric(alpha)
  se_ci <- sqrt(p_hat * (1 - p_hat) / n)
  z_critical <- qnorm(1 - alpha_val/2)
  ci_lower <- p_hat - z_critical * se_ci
  ci_upper <- p_hat + z_critical * se_ci
  
  list(
    test_statistic = z_stat,
    p_value = p_value,
    confidence_interval_lower = ci_lower,
    confidence_interval_upper = ci_upper,
    reject_null = p_value < alpha_val
  )
}

proportion_test_two_sample <- function(data1_json, data2_json, alternative) {
  data1 <- parse_json_array(data1_json)
  data2 <- parse_json_array(data2_json)
  
  # Calculate sample proportions
  successes1 <- sum(data1)
  n1 <- length(data1)
  p1 <- successes1 / n1
  
  successes2 <- sum(data2)
  n2 <- length(data2)
  p2 <- successes2 / n2
  
  # Calculate pooled proportion
  p_pooled <- (successes1 + successes2) / (n1 + n2)
  
  # Calculate z-statistic
  se <- sqrt(p_pooled * (1 - p_pooled) * (1/n1 + 1/n2))
  z_stat <- (p1 - p2) / se
  
  # Calculate p-value
  if (alternative == "two.sided") {
    p_value <- 2 * (1 - pnorm(abs(z_stat)))
  } else if (alternative == "less") {
    p_value <- pnorm(z_stat)
  } else {
    p_value <- 1 - pnorm(z_stat)
  }
  
  # Calculate confidence interval
  se_diff <- sqrt(p1 * (1 - p1) / n1 + p2 * (1 - p2) / n2)
  z_critical <- qnorm(1 - 0.05/2) # Assume alpha = 0.05
  ci_lower <- (p1 - p2) - z_critical * se_diff
  ci_upper <- (p1 - p2) + z_critical * se_diff
  
  list(
    test_statistic = z_stat,
    p_value = p_value,
    confidence_interval_lower = ci_lower,
    confidence_interval_upper = ci_upper,
    reject_null = p_value < 0.05
  )
}

# Override the call function for proportion tests
call_stat_test_function <- function(args, test_functions) {
  switch(args$func,
    "prop.test.one" = proportion_test_one_sample(args$args[1], args$args[2], args$args[3], args$args[4]),
    "prop.test.two" = proportion_test_two_sample(args$args[1], args$args[2], args$args[3]),
    NA
  )
}

# Run the test
run_stat_test(NULL)
