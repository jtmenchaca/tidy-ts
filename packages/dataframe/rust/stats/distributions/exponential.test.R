#!/usr/bin/env Rscript

# Exponential distribution test script
# Usage: Rscript exponential.test.R <function> <x_or_p> <rate> [lower_tail] [log_p]

source("test-helpers.R")

# Define exponential distribution functions
exponential_density <- function(x, rate, log = FALSE) {
  dexp(x, rate, log = log)
}

exponential_cumulative <- function(x, rate, lower.tail = TRUE, log.p = FALSE) {
  pexp(x, rate, lower.tail = lower.tail, log.p = log.p)
}

exponential_quantile <- function(p, rate, lower.tail = TRUE, log.p = FALSE) {
  qexp(p, rate, lower.tail = lower.tail, log.p = log.p)
}

exponential_random <- function(n, rate) {
  rexp(n, rate)
}

# Run the test
run_distribution_test(exponential_density, exponential_cumulative, exponential_quantile, exponential_random)
