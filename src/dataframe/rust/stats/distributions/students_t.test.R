#!/usr/bin/env Rscript

# Student's t distribution test script
# Usage: Rscript students_t.test.R <function> <x_or_p> <df> [lower_tail] [log_p]

source("test-helpers.R")

# Define Student's t distribution functions
students_t_density <- function(x, df, log = FALSE) {
  dt(x, df, log = log)
}

students_t_cumulative <- function(x, df, lower.tail = TRUE, log.p = FALSE) {
  pt(x, df, lower.tail = lower.tail, log.p = log.p)
}

students_t_quantile <- function(p, df, lower.tail = TRUE, log.p = FALSE) {
  qt(p, df, lower.tail = lower.tail, log.p = log.p)
}

students_t_random <- function(n, df) {
  rt(n, df)
}

# Run the test
run_distribution_test(students_t_density, students_t_cumulative, students_t_quantile, students_t_random)