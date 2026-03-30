# Companion to singtest.test.ts — singular X matrix handling.
# Usage (from this directory): Rscript singtest-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "source-tests", "r-json-emit.R"))

options(na.action = na.exclude)

test1 <- data.frame(
  time = c(4, 3, 1, 1, 2, 2, 3),
  status = c(1, NA, 1, 0, 1, 1, 0),
  x = c(0, 2, 1, 1, 1, 0, 0)
)

temp <- rep(0:3, rep(7, 4))
stest <- data.frame(
  start = 10 * temp,
  stop = 10 * temp + test1$time,
  status = rep(test1$status, 4),
  x = c(test1$x + 1:7, rep(test1$x, 3)),
  epoch = rep(1:4, rep(7, 4))
)

# Will create a warning about a singular X matrix
suppressWarnings({
  fit1 <- coxph(Surv(start, stop, status) ~ x * factor(epoch), stest)
})

result <- list(
  coef = as.vector(fit1$coef),
  na_pattern = is.na(fit1$coef),
  loglik = fit1$loglik,
  n = fit1$n,
  nevent = fit1$nevent
)
emit_reference(result)
