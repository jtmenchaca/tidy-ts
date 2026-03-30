# Companion to tiedtime.test.ts — tied event times / floating-point ties (R survival).
# Usage (from this directory): Rscript tiedtime-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "source-tests", "r-json-emit.R"))

# ── tiedtime: floating-point tie handling ──
tdata <- data.frame(
  time = c(1, 2, sqrt(2)^2, 2, sqrt(2)^2),
  status = rep(1, 5),
  group = c(1, 1, 1, 2, 2)
)
fit <- survfit(Surv(time, status) ~ group, data = tdata)

result <- list(
  sum_strata = sum(fit$strata),
  length_time = length(fit$time),
  strata = as.vector(fit$strata),
  time = fit$time,
  surv = fit$surv,
  n_risk = fit$n.risk,
  n_event = fit$n.event
)
emit_reference(result)
