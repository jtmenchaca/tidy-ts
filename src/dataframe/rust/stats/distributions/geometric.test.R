#!/usr/bin/env Rscript

# Geometric distribution test script
# Usage: Rscript geometric.test.R <function> <x_or_p> <prob> [lower_tail] [log_p]

source("test-helpers.R")

# Define geometric distribution functions
geometric_density <- function(x, prob, log = FALSE) {
  dgeom(x, prob, log = log)
}

geometric_cumulative <- function(x, prob, lower.tail = TRUE, log.p = FALSE) {
  pgeom(x, prob, lower.tail = lower.tail, log.p = log.p)
}

geometric_quantile <- function(p, prob, lower.tail = TRUE, log.p = FALSE) {
  qgeom(p, prob, lower.tail = lower.tail, log.p = log.p)
}

geometric_random <- function(n, prob) {
  rgeom(n, prob)
}

# Run the test
run_distribution_test(geometric_density, geometric_cumulative, geometric_quantile, geometric_random)