#!/usr/bin/env Rscript

# Negative binomial distribution test script
# Usage: Rscript negative_binomial.test.R <function> <x_or_p> <r> <p> [lower_tail] [log_p]

source("test-helpers.R")

# Define negative binomial distribution functions
negative_binomial_density <- function(x, r, p, log = FALSE) {
  dnbinom(x, r, p, log = log)
}

negative_binomial_cumulative <- function(x, r, p, lower.tail = TRUE, log.p = FALSE) {
  pnbinom(x, r, p, lower.tail = lower.tail, log.p = log.p)
}

negative_binomial_quantile <- function(p, r, prob, lower.tail = TRUE, log.p = FALSE) {
  qnbinom(p, r, prob, lower.tail = lower.tail, log.p = log.p)
}

negative_binomial_random <- function(n, r, p) {
  rnbinom(n, r, p)
}

# Run the test
run_distribution_test(negative_binomial_density, negative_binomial_cumulative, negative_binomial_quantile, negative_binomial_random)