# Companion to survfit2.test.ts — modified Dory-Korn confidence interval.
# Usage (from this directory): Rscript survfit2-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "source-tests", "r-json-emit.R"))

tdata <- data.frame(time = 1:10, status = c(1,0,1,0,1,0,0,0,1,0))
fit1 <- survfit(Surv(time, status) ~ 1, tdata, conf.lower = 'modified')
fit2 <- survfit(Surv(time, status) ~ 1, tdata)

stdlow <- fit2$std.err * sqrt(c(1, 10/9, 1, 8/7, 1, 6/5, 6/4, 6/3, 1, 2/1))
lower <- exp(log(fit2$surv) - qnorm(.975) * stdlow)

result <- list(
  time = fit2$time,
  surv = fit2$surv,
  std_err = fit2$std.err,
  cumhaz = fit2$cumhaz,
  modified_lower = fit1$lower,
  expected_lower = as.vector(lower),
  regular_lower = fit2$lower,
  regular_upper = fit2$upper,
  n_risk = fit2$n.risk,
  n_event = fit2$n.event
)
emit_reference(result)
