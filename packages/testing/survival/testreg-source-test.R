# Companion to testreg.test.ts — parametric survreg (Tier 4).
# Usage (from this directory): Rscript testreg-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "source-tests", "r-json-emit.R"))

test1 <- data.frame(
  time = c(4, 3, 1, 1, 2, 2, 3),
  status = c(1, NA, 1, 0, 1, 1, 0),
  x = c(0, 2, 1, 1, 1, 0, 0)
)

# Basic Weibull survreg
fit <- survreg(Surv(time, status) ~ x, test1, dist = 'weibull')

result <- list(
  coef = as.vector(coef(fit)),
  loglik = fit$loglik,
  scale = fit$scale,
  dist = "weibull",
  n = fit$df.residual + length(coef(fit)) + 1
)
emit_reference(result)
