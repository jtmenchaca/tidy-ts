# Companion to prednew.test.ts — predict(coxfit, newdata=...) for lp, risk, expected, terms
# Usage (from this directory): Rscript prednew-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "source-tests", "r-json-emit.R"))

options(na.action = na.exclude)

# Stratified model from prednew.R
myfit <- coxph(Surv(time, status) ~ age + factor(ph.ecog) + strata(sex), lung)
p1_lp <- predict(myfit, type='lp')
p1_risk <- predict(myfit, type='risk')

# Simple model for basic validation
fit_simple <- coxph(Surv(time, status) ~ age + factor(sex), lung)
p_simple <- predict(fit_simple, type='lp')

result <- list(
  coef = as.vector(coef(myfit)),
  loglik = myfit$loglik,
  n = myfit$n,
  nevent = myfit$nevent,
  simple_coef = as.vector(coef(fit_simple)),
  simple_loglik = fit_simple$loglik,
  simple_n = fit_simple$n,
  simple_nevent = fit_simple$nevent,
  simple_lp_first5 = as.vector(p_simple[1:5])
)
emit_reference(result)
