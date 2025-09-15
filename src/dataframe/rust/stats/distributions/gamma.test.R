#!/usr/bin/env Rscript

# Gamma distribution test script
# Usage: Rscript gamma.test.R <function> <x_or_p> <shape> <rate> [lower_tail] [log_p]

source("test-helpers.R")

# Define gamma distribution functions
gamma_density <- function(x, shape, rate, log = FALSE) {
  dgamma(x, shape, rate, log = log)
}

gamma_cumulative <- function(x, shape, rate, lower.tail = TRUE, log.p = FALSE) {
  pgamma(x, shape, rate, lower.tail = lower.tail, log.p = log.p)
}

gamma_quantile <- function(p, shape, rate, lower.tail = TRUE, log.p = FALSE) {
  qgamma(p, shape, rate, lower.tail = lower.tail, log.p = log.p)
}

gamma_random <- function(n, shape, rate) {
  rgamma(n, shape, rate)
}

# Run the test
run_distribution_test(gamma_density, gamma_cumulative, gamma_quantile, gamma_random)
