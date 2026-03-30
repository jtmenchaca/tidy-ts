# Companion to summary_survfit.test.ts — scale option and subscripting of summary.survfit
# Usage (from this directory): Rscript summary_survfit-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "source-tests", "r-json-emit.R"))

fit <- survfit(Surv(futime, fustat) ~ rx, data=ovarian)
temp1 <- summary(fit)

result <- list(
  time = temp1$time,
  surv = temp1$surv,
  n_risk = temp1$n.risk,
  strata = as.vector(temp1$strata)
)
emit_reference(result)
