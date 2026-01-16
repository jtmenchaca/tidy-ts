#!/usr/bin/env Rscript

# Beta distribution test script
# Usage: Rscript beta.test.R <function> <x_or_p> <shape1> <shape2> [lower_tail] [log_p]

source("test-helpers.R")

# Define beta distribution functions
beta_density <- function(x, shape1, shape2, log = FALSE) {
  dbeta(x, shape1, shape2, log = log)
}

beta_cumulative <- function(x, shape1, shape2, lower.tail = TRUE, log.p = FALSE) {
  pbeta(x, shape1, shape2, lower.tail = lower.tail, log.p = log.p)
}

beta_quantile <- function(p, shape1, shape2, lower.tail = TRUE, log.p = FALSE) {
  qbeta(p, shape1, shape2, lower.tail = lower.tail, log.p = log.p)
}

beta_random <- function(n, shape1, shape2) {
  rbeta(n, shape1, shape2)
}

# Run the test
run_distribution_test(beta_density, beta_cumulative, beta_quantile, beta_random)
