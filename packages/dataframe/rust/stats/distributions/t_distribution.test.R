#!/usr/bin/env Rscript

# t distribution test script
# Usage: Rscript t_distribution.test.R <function> <x_or_p> <df> [lower_tail] [log_p]

source("test-helpers.R")

# Define t distribution functions
t_density <- function(x, df, log = FALSE) {
  dt(x, df, log = log)
}

t_cumulative <- function(x, df, lower.tail = TRUE, log.p = FALSE) {
  pt(x, df, lower.tail = lower.tail, log.p = log.p)
}

t_quantile <- function(p, df, lower.tail = TRUE, log.p = FALSE) {
  qt(p, df, lower.tail = lower.tail, log.p = log.p)
}

t_random <- function(n, df) {
  rt(n, df)
}

# Run the test
run_distribution_test(t_density, t_cumulative, t_quantile, t_random)
