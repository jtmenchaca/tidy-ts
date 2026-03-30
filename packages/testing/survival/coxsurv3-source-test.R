# Companion to coxsurv3.test.ts — counting-process Cox survfit with hand-computed values.
# Usage (from this directory): Rscript coxsurv3-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "source-tests", "r-json-emit.R"))

test2 <- data.frame(
  start = c(1, 2, 5, 2, 1, 7, 3, 4, 8, 8),
  stop  = c(2, 3, 6, 7, 8, 9, 9, 9, 14, 17),
  event = c(1, 1, 1, 1, 1, 1, 1, 0, 0, 0),
  x     = c(1, 0, 0, 1, 0, 1, 1, 1, 0, 0)
)

fit <- coxph(Surv(start, stop, event) ~ x, test2)
surv1 <- survfit(fit, newdata = list(x = 0), censor = FALSE)

# Hand-computed hazard at each event time
r <- exp(fit$coefficients)
true_lambda <- c(1/(r+1), 1/(r+2), 1/(3*r+2), 1/(3*r+1),
                 1/(3*r+1), 1/(3*r+2) + 1/(2*r+2))
true_time <- c(2, 3, 6, 7, 8, 9)

result <- list(
  coef = as.vector(fit$coefficients),
  loglik = fit$loglik,
  surv1_time = surv1$time,
  surv1_surv = surv1$surv,
  surv1_cumhaz = surv1$cumhaz,
  surv1_std_err = surv1$std.err,
  true_lambda = true_lambda,
  true_time = true_time,
  true_cumhaz = cumsum(true_lambda)
)
emit_reference(result)
