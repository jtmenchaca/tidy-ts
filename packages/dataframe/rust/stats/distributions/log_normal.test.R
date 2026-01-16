#!/usr/bin/env Rscript

# Log-normal distribution test script
# Usage: Rscript log_normal.test.R <function> <x_or_p> <meanlog> <sdlog> [lower_tail] [log_p]

source("test-helpers.R")

# Define log-normal distribution functions
log_normal_density <- function(x, meanlog, sdlog, log = FALSE) {
  dlnorm(x, meanlog, sdlog, log = log)
}

log_normal_cumulative <- function(x, meanlog, sdlog, lower.tail = TRUE, log.p = FALSE) {
  plnorm(x, meanlog, sdlog, lower.tail = lower.tail, log.p = log.p)
}

log_normal_quantile <- function(p, meanlog, sdlog, lower.tail = TRUE, log.p = FALSE) {
  qlnorm(p, meanlog, sdlog, lower.tail = lower.tail, log.p = log.p)
}

log_normal_random <- function(n, meanlog, sdlog) {
  rlnorm(n, meanlog, sdlog)
}

# Run the test
run_distribution_test(log_normal_density, log_normal_cumulative, log_normal_quantile, log_normal_random)