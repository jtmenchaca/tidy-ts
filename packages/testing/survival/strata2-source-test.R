# Companion to strata2.test.ts — strata-by-covariate interactions
# Usage (from this directory): Rscript strata2-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "source-tests", "r-json-emit.R"))

# ── Strata-by-covariate interaction ──────────────────────────────────────
# strata2.R tests the interaction between a covariate and strata:
#   coxph(Surv(time, status) ~ age + sex:strata(ph.ecog), lung)
# This means sex has a different effect in each ph.ecog stratum.

tdata <- na.omit(lung[, c('time', 'status', 'age', 'sex', 'ph.ecog')])
fit1 <- coxph(Surv(time, status) ~ age + sex:strata(ph.ecog), tdata)

# Simple strata model for comparison (no interaction)
fit2 <- coxph(Surv(time, status) ~ age + sex + strata(ph.ecog), tdata)

result <- list(
  coef        = as.vector(coef(fit1)),
  coef_names  = names(coef(fit1)),
  loglik      = fit1$loglik,
  n           = fit1$n,
  nevent      = fit1$nevent,
  simple_coef = as.vector(coef(fit2)),
  simple_loglik = fit2$loglik,
  simple_n    = fit2$n
)
emit_reference(result)
