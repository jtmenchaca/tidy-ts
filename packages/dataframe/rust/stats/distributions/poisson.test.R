#!/usr/bin/env Rscript

# Poisson distribution test script
# Usage: Rscript poisson.test.R <function> <x_or_p> <lambda> [lower_tail] [log_p]

source("test-helpers.R")

# Define Poisson distribution functions
poisson_density <- function(x, lambda, log = FALSE) {
  dpois(x, lambda, log = log)
}

poisson_cumulative <- function(x, lambda, lower.tail = TRUE, log.p = FALSE) {
  ppois(x, lambda, lower.tail = lower.tail, log.p = log.p)
}

poisson_quantile <- function(p, lambda, lower.tail = TRUE, log.p = FALSE) {
  qpois(p, lambda, lower.tail = lower.tail, log.p = log.p)
}

poisson_random <- function(n, lambda) {
  rpois(n, lambda)
}

# Run the test
run_distribution_test(poisson_density, poisson_cumulative, poisson_quantile, poisson_random)
