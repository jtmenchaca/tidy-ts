# Companion to testnull.test.ts — null Cox models with strata.
# Usage (from this directory): Rscript testnull-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "source-tests", "r-json-emit.R"))

options(na.action = na.exclude)

# Right-censored
fit1_rc <- coxph(Surv(stop, event) ~ rx + strata(number), bladder, iter = 0)
fit2_rc <- coxph(Surv(stop, event) ~ strata(number), bladder)

# Counting process
fit1_cp <- coxph(Surv(start, stop, event) ~ rx + strata(number), bladder2, iter = 0)
fit2_cp <- coxph(Surv(start, stop, event) ~ strata(number), bladder2)

result <- list(
  rc_loglik_iter0 = fit1_rc$loglik[2],
  rc_loglik_null = fit2_rc$loglik,
  rc_resid_iter0 = as.vector(fit1_rc$resid),
  rc_resid_null = as.vector(fit2_rc$resid),
  rc_coef = as.vector(coef(fit1_rc)),
  cp_loglik_iter0 = fit1_cp$loglik[2],
  cp_loglik_null = fit2_cp$loglik,
  cp_resid_iter0 = as.vector(fit1_cp$resid),
  cp_resid_null = as.vector(fit2_cp$resid),
  cp_coef = as.vector(coef(fit1_cp))
)
emit_reference(result)
