#!/usr/bin/env Rscript

# Wilcoxon distribution test script
# Usage: Rscript wilcoxon.test.R <function> <x_or_p> <m> <n> [lower_tail] [log_p]

source("test-helpers.R")

# Define Wilcoxon distribution functions
wilcoxon_density <- function(x, m, n, log = FALSE) {
  dwilcox(x, m, n, log = log)
}

wilcoxon_cumulative <- function(x, m, n, lower.tail = TRUE, log.p = FALSE) {
  pwilcox(x, m, n, lower.tail = lower.tail, log.p = log.p)
}

wilcoxon_quantile <- function(p, m, n, lower.tail = TRUE, log.p = FALSE) {
  qwilcox(p, m, n, lower.tail = lower.tail, log.p = log.p)
}

wilcoxon_random <- function(nn, m, n) {
  rwilcox(nn, m, n)
}

# Run the test
run_distribution_test(wilcoxon_density, wilcoxon_cumulative, wilcoxon_quantile, wilcoxon_random)