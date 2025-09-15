#!/usr/bin/env Rscript

# Normal distribution test script
# Usage: Rscript normal.test.R <function> <x_or_p> <mean> <sd> [lower_tail] [log_p]

source("test-helpers.R")

# Define normal distribution functions
normal_density <- function(x, mean, sd, log = FALSE) {
  dnorm(x, mean, sd, log = log)
}

normal_cumulative <- function(x, mean, sd, lower.tail = TRUE, log.p = FALSE) {
  pnorm(x, mean, sd, lower.tail = lower.tail, log.p = log.p)
}

normal_quantile <- function(p, mean, sd, lower.tail = TRUE, log.p = FALSE) {
  qnorm(p, mean, sd, lower.tail = lower.tail, log.p = log.p)
}

normal_random <- function(n, mean, sd) {
  rnorm(n, mean, sd)
}

# Run the test
run_distribution_test(normal_density, normal_cumulative, normal_quantile, normal_random)
