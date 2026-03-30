# Companion to coxsurv4.test.ts — strata-by-covariate interactions.
# Usage (from this directory): Rscript coxsurv4-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "source-tests", "r-json-emit.R"))

options(na.action = na.exclude)

tdata <- na.omit(lung[, c('time', 'status', 'age', 'sex', 'ph.ecog')])
fit1 <- coxph(Surv(time, status) ~ age * strata(sex) + strata(ph.ecog),
              data = tdata)

result <- list(
  coef = as.vector(coef(fit1)),
  loglik = fit1$loglik,
  n = fit1$n,
  nevent = fit1$nevent,
  coef_names = names(coef(fit1))
)
emit_reference(result)
