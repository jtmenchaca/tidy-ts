#!/usr/bin/env Rscript

# Chi-squared distribution test script
# Usage: Rscript chi_squared.test.R <function> <x_or_p> <df> [lower_tail] [log_p]

source("test-helpers.R")

# Define chi-squared distribution functions
chi_squared_density <- function(x, df, log = FALSE) {
  dchisq(x, df, log = log)
}

chi_squared_cumulative <- function(x, df, lower.tail = TRUE, log.p = FALSE) {
  pchisq(x, df, lower.tail = lower.tail, log.p = log.p)
}

chi_squared_quantile <- function(p, df, lower.tail = TRUE, log.p = FALSE) {
  qchisq(p, df, lower.tail = lower.tail, log.p = log.p)
}

chi_squared_random <- function(n, df) {
  rchisq(n, df)
}

# Run the test
run_distribution_test(chi_squared_density, chi_squared_cumulative, chi_squared_quantile, chi_squared_random)
