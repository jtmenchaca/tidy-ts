# Companion to coxsurv5.test.ts — multi-state survival (Tier 4).
# Usage (from this directory): Rscript coxsurv5-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "source-tests", "r-json-emit.R"))

# Multi-state test data from coxsurv5.R
mtest <- data.frame(
  id    = c(1, 1, 2, 2, 3, 4, 4, 5, 5, 5),
  t1    = c(0, 4, 0, 3, 0, 0, 5, 0, 1, 8),
  t2    = c(4, 8, 3, 9, 2, 5, 9, 1, 8, 10),
  st    = c(2, 0, 1, 2, 0, 1, 3, 1, 2, 0),
  x     = c(0, 0, 1, 1, 1, 0, 0, 1, 1, 1)
)
mtest$state <- factor(mtest$st, 0:3, c("censor", "a", "b", "c"))

# Fit with init and iter=0
# Note: requires multi-state support
fit <- tryCatch(
  coxph(Surv(t1, t2, state) ~ x, mtest, id = id, init = log(2), iter = 0),
  error = function(e) NULL
)

if (!is.null(fit)) {
  result <- list(
    coef = as.vector(coef(fit)),
    loglik = fit$loglik,
    n = fit$n,
    nevent = fit$nevent
  )
} else {
  result <- list(note = "Multi-state survival requires Tier 4 implementation")
}
emit_reference(result)
