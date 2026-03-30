# Companion to survfit1.test.ts — KM on aml with groups, stype=2.
# Usage (from this directory): Rscript survfit1-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "source-tests", "r-json-emit.R"))

fit1 <- survfit(Surv(time, status) ~ x, data = aml)

fit_s2 <- survfit(Surv(time, status) ~ x, data = aml, stype = 2)

result <- list(
  time = fit1$time,
  n_risk = fit1$n.risk,
  n_event = fit1$n.event,
  n_censor = fit1$n.censor,
  surv = fit1$surv,
  cumhaz = fit1$cumhaz,
  std_err = fit1$std.err,
  std_chaz = fit1$std.chaz,
  strata = as.vector(fit1$strata),
  logse = fit1$logse,
  surv_s2 = fit_s2$surv,
  cumhaz_s2 = fit_s2$cumhaz,
  std_err_s2 = fit_s2$std.err,
  std_chaz_s2 = fit_s2$std.chaz,
  n_risk_s2 = fit_s2$n.risk,
  n_event_s2 = fit_s2$n.event
)
emit_reference(result)
