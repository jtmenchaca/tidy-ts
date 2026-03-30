# Companion to coxsurv2.test.ts — Cox survfit with beta=0 matches KM.
# Usage (from this directory): Rscript coxsurv2-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "source-tests", "r-json-emit.R"))

# KM on lung by sex
surv_km <- survfit(Surv(time, status) ~ sex, data = lung)

# Aalen (stype=2)
surv_aalen <- survfit(Surv(time, status) ~ sex, data = lung, stype = 2)

result <- list(
  km_time = surv_km$time,
  km_surv = surv_km$surv,
  km_cumhaz = surv_km$cumhaz,
  km_std_err = surv_km$std.err,
  km_strata = as.vector(surv_km$strata),
  km_n_risk = surv_km$n.risk,
  km_n_event = surv_km$n.event,
  aalen_time = surv_aalen$time,
  aalen_surv = surv_aalen$surv,
  aalen_cumhaz = surv_aalen$cumhaz,
  aalen_std_err = surv_aalen$std.err,
  aalen_strata = as.vector(surv_aalen$strata)
)
emit_reference(result)
