# Companion to quantile.test.ts — quantile routine for survfit objects
# Usage (from this directory): Rscript quantile-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "source-tests", "r-json-emit.R"))

test1 <- data.frame(
  time = c(9, 3, 1, 1, 6, 6, 8, 10),
  status = c(1, NA, 1, 0, 1, 1, 0, 0),
  x = c(0, 2, 1, 1, 1, 0, 0, 0)
)

qq <- c(13/14, 6/7, 2/3, .5, 9/35, .1)
fit1 <- survfit(Surv(time, status) ~ 1, test1, conf.type='none')
q1 <- quantile(fit1, 1 - qq)

result <- list(
  surv = fit1$surv,
  time = fit1$time,
  n_risk = fit1$n.risk,
  n_event = fit1$n.event,
  quantiles = as.vector(q1),
  qq = qq,
  probs = 1 - qq
)
emit_reference(result)
