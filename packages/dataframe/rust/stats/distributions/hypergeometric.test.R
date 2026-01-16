#!/usr/bin/env Rscript

# Hypergeometric distribution test script
# Usage: Rscript hypergeometric.test.R <function> <x_or_p> <m> <n> <k> [lower_tail] [log_p]

source("test-helpers.R")

# Define hypergeometric distribution functions
hypergeometric_density <- function(x, m, n, k, log = FALSE) {
  dhyper(x, m, n, k, log = log)
}

hypergeometric_cumulative <- function(x, m, n, k, lower.tail = TRUE, log.p = FALSE) {
  phyper(x, m, n, k, lower.tail = lower.tail, log.p = log.p)
}

hypergeometric_quantile <- function(p, m, n, k, lower.tail = TRUE, log.p = FALSE) {
  qhyper(p, m, n, k, lower.tail = lower.tail, log.p = log.p)
}

hypergeometric_random <- function(nn, m, n, k) {
  rhyper(nn, m, n, k)
}

# Run the test
run_distribution_test(hypergeometric_density, hypergeometric_cumulative, hypergeometric_quantile, hypergeometric_random)