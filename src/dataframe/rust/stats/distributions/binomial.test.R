#!/usr/bin/env Rscript

# Binomial distribution test script
# Usage: Rscript binomial.test.R <function> <x_or_p> <size> <prob> [lower_tail] [log_p]

source("test-helpers.R")

# Define binomial distribution functions
binomial_density <- function(x, size, prob, log = FALSE) {
  dbinom(x, size, prob, log = log)
}

binomial_cumulative <- function(x, size, prob, lower.tail = TRUE, log.p = FALSE) {
  pbinom(x, size, prob, lower.tail = lower.tail, log.p = log.p)
}

binomial_quantile <- function(p, size, prob, lower.tail = TRUE, log.p = FALSE) {
  qbinom(p, size, prob, lower.tail = lower.tail, log.p = log.p)
}

binomial_random <- function(n, size, prob) {
  rbinom(n, size, prob)
}

# Run the test
run_distribution_test(binomial_density, binomial_cumulative, binomial_quantile, binomial_random)
