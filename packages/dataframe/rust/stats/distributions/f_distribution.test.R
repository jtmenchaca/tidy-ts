#!/usr/bin/env Rscript

# F distribution test script
# Usage: Rscript f_distribution.test.R <function> <x_or_p> <df1> <df2> [lower_tail] [log_p]

source("test-helpers.R")

# Define F distribution functions
f_density <- function(x, df1, df2, log = FALSE) {
  df(x, df1, df2, log = log)
}

f_cumulative <- function(x, df1, df2, lower.tail = TRUE, log.p = FALSE) {
  pf(x, df1, df2, lower.tail = lower.tail, log.p = log.p)
}

f_quantile <- function(p, df1, df2, lower.tail = TRUE, log.p = FALSE) {
  qf(p, df1, df2, lower.tail = lower.tail, log.p = log.p)
}

f_random <- function(n, df1, df2) {
  rf(n, df1, df2)
}

# Run the test
run_distribution_test(f_density, f_cumulative, f_quantile, f_random)
