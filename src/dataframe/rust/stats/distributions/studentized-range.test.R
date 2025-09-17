#!/usr/bin/env Rscript

# Studentized Range distribution test script
# Usage: Rscript studentized-range.test.R <function> <x_or_p> <nmeans> <df> [lower_tail] [log_p]

source("test-helpers.R")

# Define studentized range (Tukey) distribution functions
tukey_density <- function(x, nmeans, df, log = FALSE) {
  # R doesn't have a built-in dtukey function, so we'll approximate
  # This is mainly for completeness
  if (x <= 0) return(if (log) -Inf else 0)
  
  # Very rough approximation for density
  # In practice, this would require numerical computation
  if (log) {
    log(0.001) # Placeholder
  } else {
    0.001 # Placeholder
  }
}

tukey_cumulative <- function(x, nmeans, df, lower.tail = TRUE, log.p = FALSE) {
  ptukey(x, nmeans, df, lower.tail = lower.tail, log.p = log.p)
}

tukey_quantile <- function(p, nmeans, df, lower.tail = TRUE, log.p = FALSE) {
  qtukey(p, nmeans, df, lower.tail = lower.tail, log.p = log.p)
}

tukey_random <- function(n, nmeans, df) {
  # R doesn't have a built-in rtukey function
  # Generate using quantile function with uniform random variables
  u <- runif(n)
  qtukey(u, nmeans, df)
}

# Test specific values that are important for Tukey HSD
test_tukey_specific <- function() {
  cat("=== Specific Tukey HSD Values ===\n")
  
  # Test case from our failing test: 3 groups, df=12
  nmeans <- 3
  df <- 12
  alpha <- 0.05
  
  # Critical value (upper tail)
  critical <- qtukey(1 - alpha, nmeans, df)
  cat(sprintf("Critical value (α=%.3f, k=%d, df=%d): %.6f\n", alpha, nmeans, df, critical))
  
  # P-value for q=1.0 (our test statistic)
  q_stat <- 1.0
  p_value <- 1 - ptukey(q_stat, nmeans, df)
  cat(sprintf("P-value for q=%.1f: %.6f\n", q_stat, p_value))
  
  # Test different group counts
  for (k in 2:5) {
    crit <- qtukey(0.95, k, df)
    cat(sprintf("Critical value (95%%, k=%d, df=%d): %.6f\n", k, df, crit))
  }
  
  # Test different degrees of freedom
  for (d in c(5, 10, 15, 20, 30)) {
    crit <- qtukey(0.95, 3, d)
    cat(sprintf("Critical value (95%%, k=3, df=%d): %.6f\n", d, crit))
  }
}

# Override the call function for studentized range tests
call_distribution_function <- function(args, test_functions) {
  func_name <- args$func
  x_or_p <- as.numeric(args$args[1])
  nmeans <- as.numeric(args$args[2])
  df <- as.numeric(args$args[3])
  
  # Optional parameters
  lower_tail <- if (length(args$args) >= 4) as.logical(args$args[4]) else TRUE
  log_p <- if (length(args$args) >= 5) as.logical(args$args[5]) else FALSE
  
  switch(func_name,
    "dtukey" = tukey_density(x_or_p, nmeans, df, log = log_p),
    "ptukey" = tukey_cumulative(x_or_p, nmeans, df, lower.tail = lower_tail, log.p = log_p),
    "qtukey" = tukey_quantile(x_or_p, nmeans, df, lower.tail = lower_tail, log.p = log_p),
    "rtukey" = tukey_random(x_or_p, nmeans, df),
    "tukey.critical" = qtukey(1 - x_or_p, nmeans, df),
    "tukey.pvalue" = 1 - ptukey(x_or_p, nmeans, df),
    NA
  )
}

# Main execution
args <- commandArgs(trailingOnly = TRUE)

if (length(args) == 0 || (length(args) == 1 && args[1] == "specific")) {
  test_tukey_specific()
} else {
  # Run standard distribution test
  run_distribution_test(tukey_density, tukey_cumulative, tukey_quantile, tukey_random)
}