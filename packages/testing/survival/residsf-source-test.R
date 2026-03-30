# Companion to residsf.test.ts — residuals.survfit influence-based residuals
# Usage (from this directory): Rscript residsf-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "source-tests", "r-json-emit.R"))

# Simple survfit with influence computation on test data
test1 <- data.frame(
  time = c(9, 3, 1, 1, 6, 6, 8),
  status = c(1, NA, 1, 0, 1, 1, 0),
  x = c(0, 2, 1, 1, 1, 0, 0)
)

s1 <- survfit(Surv(time, status) ~ 1, test1, influence = 3)

result <- list(
  surv = s1$surv,
  time = s1$time,
  n_risk = s1$n.risk,
  note = "residuals.survfit requires influence computation in survfit"
)
emit_reference(result)
