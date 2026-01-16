#!/usr/bin/env Rscript

# Uniform distribution test script
# Usage: Rscript uniform.test.R <function> <x_or_p> <min> <max> [lower_tail] [log_p]

source("test-helpers.R")

# Define uniform distribution functions
uniform_density <- function(x, min, max, log = FALSE) {
  dunif(x, min, max, log = log)
}

uniform_cumulative <- function(x, min, max, lower.tail = TRUE, log.p = FALSE) {
  punif(x, min, max, lower.tail = lower.tail, log.p = log.p)
}

uniform_quantile <- function(p, min, max, lower.tail = TRUE, log.p = FALSE) {
  qunif(p, min, max, lower.tail = lower.tail, log.p = log.p)
}

uniform_random <- function(n, min, max) {
  runif(n, min, max)
}

# Run the test
run_distribution_test(uniform_density, uniform_cumulative, uniform_quantile, uniform_random)
