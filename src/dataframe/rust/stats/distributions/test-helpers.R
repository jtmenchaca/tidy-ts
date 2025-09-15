#!/usr/bin/env Rscript

# Shared test helpers for distribution functions
# This file provides common argument parsing and function calling utilities

# Parse command line arguments for distribution functions
# Returns a list with parsed arguments
parse_distribution_args <- function() {
  args <- commandArgs(trailingOnly = TRUE)
  
  if (length(args) < 3) {
    stop("Usage: Rscript <distribution>.test.R <function> <x_or_p> <param1> [param2] [param3] [lower_tail] [log_p]")
  }
  
  func <- args[1]
  x_or_p <- as.numeric(args[2])
  param1 <- as.numeric(args[3])
  
  # For functions with different numbers of parameters, we need to detect this
  # Based on the function name and adjust the parameter parsing accordingly
  if (func %in% c("dbeta", "pbeta", "qbeta", "rbeta", "dgamma", "pgamma", "qgamma", "rgamma",
                  "df", "pf", "qf", "rf", "dbinom", "pbinom", "qbinom", "rbinom", "dunif", "punif", "qunif", "runif",
                  "dweibull", "pweibull", "qweibull", "rweibull", "dhyper", "phyper", "qhyper", "rhyper",
                  "dlnorm", "plnorm", "qlnorm", "rlnorm", "dnbinom", "pnbinom", "qnbinom", "rnbinom",
                  "dwilcox", "pwilcox", "qwilcox", "rwilcox", "dnorm", "pnorm", "qnorm", "rnorm")) {
    # Two parameter distributions - param2 in args[4], lower_tail in args[5], log_p in args[6]
    param2 <- if (length(args) > 3) as.numeric(args[4]) else NULL
    param3 <- if (func %in% c("dhyper", "phyper", "qhyper", "rhyper") && length(args) > 4) as.numeric(args[5]) else NULL
    if (func %in% c("dhyper", "phyper", "qhyper", "rhyper")) {
      # Hypergeometric has 3 parameters
      lower_tail <- if (length(args) > 5) as.logical(as.numeric(args[6])) else TRUE
      log_p <- if (length(args) > 6) as.logical(as.numeric(args[7])) else FALSE
    } else {
      # Most distributions have 2 parameters
      lower_tail <- if (length(args) > 4) as.logical(as.numeric(args[5])) else TRUE
      log_p <- if (length(args) > 5) as.logical(as.numeric(args[6])) else FALSE
    }
  } else {
    # Single parameter distributions - lower_tail in args[4], log_p in args[5]
    param2 <- NULL
    param3 <- NULL
    lower_tail <- if (length(args) > 3) as.logical(as.numeric(args[4])) else TRUE
    log_p <- if (length(args) > 4) as.logical(as.numeric(args[5])) else FALSE
  }
  
  list(
    func = func,
    x_or_p = x_or_p,
    param1 = param1,
    param2 = param2,
    param3 = param3,
    lower_tail = lower_tail,
    log_p = log_p
  )
}

# Call the appropriate distribution function based on parsed arguments
# This function should be customized for each distribution
call_distribution_function <- function(args, density_func, cumulative_func, quantile_func, random_func) {
  switch(args$func,
    # Density functions (d*)
    "dbeta" = density_func(args$x_or_p, args$param1, args$param2, log = args$log_p),
    "dnorm" = density_func(args$x_or_p, args$param1, args$param2, log = args$log_p),
    "dgamma" = density_func(args$x_or_p, args$param1, args$param2, log = args$log_p),
    "dexp" = density_func(args$x_or_p, args$param1, log = args$log_p),
    "dchisq" = density_func(args$x_or_p, args$param1, log = args$log_p),
    "df" = density_func(args$x_or_p, args$param1, args$param2, log = args$log_p),
    "dpois" = density_func(args$x_or_p, args$param1, log = args$log_p),
    "dbinom" = density_func(args$x_or_p, args$param1, args$param2, log = args$log_p),
    "dt" = density_func(args$x_or_p, args$param1, log = args$log_p),
    "dunif" = density_func(args$x_or_p, args$param1, args$param2, log = args$log_p),
    "dweibull" = density_func(args$x_or_p, args$param1, args$param2, log = args$log_p),
    "dgeom" = density_func(args$x_or_p, args$param1, log = args$log_p),
    "dhyper" = density_func(args$x_or_p, args$param1, args$param2, args$param3, log = args$log_p),
    "dlnorm" = density_func(args$x_or_p, args$param1, args$param2, log = args$log_p),
    "dnbinom" = density_func(args$x_or_p, args$param1, args$param2, log = args$log_p),
    "dwilcox" = density_func(args$x_or_p, args$param1, args$param2, log = args$log_p),
    
    # Cumulative functions (p*)
    "pbeta" = cumulative_func(args$x_or_p, args$param1, args$param2, 
                             lower.tail = args$lower_tail, log.p = args$log_p),
    "pnorm" = cumulative_func(args$x_or_p, args$param1, args$param2, 
                             lower.tail = args$lower_tail, log.p = args$log_p),
    "pgamma" = cumulative_func(args$x_or_p, args$param1, args$param2, 
                              lower.tail = args$lower_tail, log.p = args$log_p),
    "pexp" = cumulative_func(args$x_or_p, args$param1, 
                            lower.tail = args$lower_tail, log.p = args$log_p),
    "pchisq" = cumulative_func(args$x_or_p, args$param1, 
                              lower.tail = args$lower_tail, log.p = args$log_p),
    "pf" = cumulative_func(args$x_or_p, args$param1, args$param2, 
                          lower.tail = args$lower_tail, log.p = args$log_p),
    "ppois" = cumulative_func(args$x_or_p, args$param1, 
                             lower.tail = args$lower_tail, log.p = args$log_p),
    "pbinom" = cumulative_func(args$x_or_p, args$param1, args$param2, 
                              lower.tail = args$lower_tail, log.p = args$log_p),
    "pt" = cumulative_func(args$x_or_p, args$param1, 
                          lower.tail = args$lower_tail, log.p = args$log_p),
    "punif" = cumulative_func(args$x_or_p, args$param1, args$param2, 
                             lower.tail = args$lower_tail, log.p = args$log_p),
    "pweibull" = cumulative_func(args$x_or_p, args$param1, args$param2, 
                                lower.tail = args$lower_tail, log.p = args$log_p),
    "pgeom" = cumulative_func(args$x_or_p, args$param1, 
                             lower.tail = args$lower_tail, log.p = args$log_p),
    "phyper" = cumulative_func(args$x_or_p, args$param1, args$param2, args$param3, 
                              lower.tail = args$lower_tail, log.p = args$log_p),
    "plnorm" = cumulative_func(args$x_or_p, args$param1, args$param2, 
                              lower.tail = args$lower_tail, log.p = args$log_p),
    "pnbinom" = cumulative_func(args$x_or_p, args$param1, args$param2, 
                               lower.tail = args$lower_tail, log.p = args$log_p),
    "pwilcox" = cumulative_func(args$x_or_p, args$param1, args$param2, 
                               lower.tail = args$lower_tail, log.p = args$log_p),
    
    # Quantile functions (q*)
    "qbeta" = quantile_func(args$x_or_p, args$param1, args$param2, 
                           lower.tail = args$lower_tail, log.p = args$log_p),
    "qnorm" = quantile_func(args$x_or_p, args$param1, args$param2, 
                           lower.tail = args$lower_tail, log.p = args$log_p),
    "qgamma" = quantile_func(args$x_or_p, args$param1, args$param2, 
                            lower.tail = args$lower_tail, log.p = args$log_p),
    "qexp" = quantile_func(args$x_or_p, args$param1, 
                          lower.tail = args$lower_tail, log.p = args$log_p),
    "qchisq" = quantile_func(args$x_or_p, args$param1, 
                            lower.tail = args$lower_tail, log.p = args$log_p),
    "qf" = quantile_func(args$x_or_p, args$param1, args$param2, 
                        lower.tail = args$lower_tail, log.p = args$log_p),
    "qpois" = quantile_func(args$x_or_p, args$param1, 
                           lower.tail = args$lower_tail, log.p = args$log_p),
    "qbinom" = quantile_func(args$x_or_p, args$param1, args$param2, 
                            lower.tail = args$lower_tail, log.p = args$log_p),
    "qt" = quantile_func(args$x_or_p, args$param1, 
                        lower.tail = args$lower_tail, log.p = args$log_p),
    "qunif" = quantile_func(args$x_or_p, args$param1, args$param2, 
                           lower.tail = args$lower_tail, log.p = args$log_p),
    "qweibull" = quantile_func(args$x_or_p, args$param1, args$param2, 
                              lower.tail = args$lower_tail, log.p = args$log_p),
    "qgeom" = quantile_func(args$x_or_p, args$param1, 
                           lower.tail = args$lower_tail, log.p = args$log_p),
    "qhyper" = quantile_func(args$x_or_p, args$param1, args$param2, args$param3, 
                            lower.tail = args$lower_tail, log.p = args$log_p),
    "qlnorm" = quantile_func(args$x_or_p, args$param1, args$param2, 
                            lower.tail = args$lower_tail, log.p = args$log_p),
    "qnbinom" = quantile_func(args$x_or_p, args$param1, args$param2, 
                             lower.tail = args$lower_tail, log.p = args$log_p),
    "qwilcox" = quantile_func(args$x_or_p, args$param1, args$param2, 
                             lower.tail = args$lower_tail, log.p = args$log_p),
    
    # Random generation functions (r*)
    "rbeta" = {
      set.seed(42)
      random_func(args$x_or_p, args$param1, args$param2)
    },
    "rnorm" = {
      set.seed(42)
      random_func(args$x_or_p, args$param1, args$param2)
    },
    "rgamma" = {
      set.seed(42)
      random_func(args$x_or_p, args$param1, args$param2)
    },
    "rexp" = {
      set.seed(42)
      random_func(args$x_or_p, args$param1)
    },
    "rchisq" = {
      set.seed(42)
      random_func(args$x_or_p, args$param1)
    },
    "rf" = {
      set.seed(42)
      random_func(args$x_or_p, args$param1, args$param2)
    },
    "rpois" = {
      set.seed(42)
      random_func(args$x_or_p, args$param1)
    },
    "rbinom" = {
      set.seed(42)
      random_func(args$x_or_p, args$param1, args$param2)
    },
    "rt" = {
      set.seed(42)
      random_func(args$x_or_p, args$param1)
    },
    "runif" = {
      set.seed(42)
      random_func(args$x_or_p, args$param1, args$param2)
    },
    "rweibull" = {
      set.seed(42)
      random_func(args$x_or_p, args$param1, args$param2)
    },
    "rgeom" = {
      set.seed(42)
      random_func(args$x_or_p, args$param1)
    },
    "rhyper" = {
      set.seed(42)
      random_func(args$x_or_p, args$param1, args$param2, args$param3)
    },
    "rlnorm" = {
      set.seed(42)
      random_func(args$x_or_p, args$param1, args$param2)
    },
    "rnbinom" = {
      set.seed(42)
      random_func(args$x_or_p, args$param1, args$param2)
    },
    "rwilcox" = {
      set.seed(42)
      random_func(args$x_or_p, args$param1, args$param2)
    },
    
    # Default case
    NA
  )
}

# Main execution function for distribution tests
run_distribution_test <- function(density_func, cumulative_func, quantile_func, random_func) {
  args <- parse_distribution_args()
  result <- call_distribution_function(args, density_func, cumulative_func, quantile_func, random_func)
  cat(result)
}
