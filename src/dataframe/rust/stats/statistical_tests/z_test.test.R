#!/usr/bin/env Rscript

# R script for z-test comparisons
# Usage: Rscript z_test.test.R <function_name> <args...>

source("test-helpers.R")

# Define z-test functions
z_test_one_sample <- function(data_json, mu, sigma, alternative, alpha) {
  data <- parse_json_array(data_json)
  
  # Manual z-test calculation since R doesn't have a built-in z.test
  n <- length(data)
  xbar <- mean(data)
  z_stat <- (xbar - as.numeric(mu)) / (as.numeric(sigma) / sqrt(n))
  
  # Calculate p-value based on alternative hypothesis
  if (alternative == "two.sided") {
    p_value <- 2 * (1 - pnorm(abs(z_stat)))
  } else if (alternative == "less") {
    p_value <- pnorm(z_stat)
  } else { # greater
    p_value <- 1 - pnorm(z_stat)
  }
  
  # Calculate confidence interval
  alpha_val <- as.numeric(alpha)
  margin_error <- qnorm(1 - alpha_val/2) * as.numeric(sigma) / sqrt(n)
  
  list(
    test_statistic = z_stat,
    p_value = p_value,
    confidence_interval_lower = xbar - margin_error,
    confidence_interval_upper = xbar + margin_error,
    reject_null = p_value < alpha_val
  )
}

z_test_two_sample <- function(data1_json, data2_json, alternative, alpha) {
  data1 <- parse_json_array(data1_json)
  data2 <- parse_json_array(data2_json)
  
  # Manual two-sample z-test calculation
  n1 <- length(data1)
  n2 <- length(data2)
  xbar1 <- mean(data1)
  xbar2 <- mean(data2)
  s1 <- sd(data1)
  s2 <- sd(data2)
  
  # Pooled standard error
  se <- sqrt(s1^2/n1 + s2^2/n2)
  z_stat <- (xbar1 - xbar2) / se
  
  # Calculate p-value based on alternative hypothesis
  if (alternative == "two.sided") {
    p_value <- 2 * (1 - pnorm(abs(z_stat)))
  } else if (alternative == "less") {
    p_value <- pnorm(z_stat)
  } else { # greater
    p_value <- 1 - pnorm(z_stat)
  }
  
  # Calculate confidence interval for difference in means
  alpha_val <- as.numeric(alpha)
  margin_error <- qnorm(1 - alpha_val/2) * se
  diff_means <- xbar1 - xbar2
  
  list(
    test_statistic = z_stat,
    p_value = p_value,
    confidence_interval_lower = diff_means - margin_error,
    confidence_interval_upper = diff_means + margin_error,
    reject_null = p_value < alpha_val
  )
}

# Override the call function for z-tests
call_stat_test_function <- function(args, test_functions) {
  switch(args$func,
    "z.test.one" = z_test_one_sample(args$args[1], args$args[2], args$args[3], args$args[4], args$args[5]),
    "z.test.two" = z_test_two_sample(args$args[1], args$args[2], args$args[3], args$args[4]),
    NA
  )
}

# Run the test
run_stat_test(NULL)
