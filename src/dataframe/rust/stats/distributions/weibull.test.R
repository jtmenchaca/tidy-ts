#!/usr/bin/env Rscript

# Weibull distribution test script
# Usage: Rscript weibull.test.R <function> <x_or_p> <shape> <scale> [lower_tail] [log_p]

source("test-helpers.R")

# Define Weibull distribution functions
weibull_density <- function(x, shape, scale, log = FALSE) {
  dweibull(x, shape, scale, log = log)
}

weibull_cumulative <- function(x, shape, scale, lower.tail = TRUE, log.p = FALSE) {
  pweibull(x, shape, scale, lower.tail = lower.tail, log.p = log.p)
}

weibull_quantile <- function(p, shape, scale, lower.tail = TRUE, log.p = FALSE) {
  qweibull(p, shape, scale, lower.tail = lower.tail, log.p = log.p)
}

weibull_random <- function(n, shape, scale) {
  rweibull(n, shape, scale)
}

# Run the test
run_distribution_test(weibull_density, weibull_cumulative, weibull_quantile, weibull_random)
