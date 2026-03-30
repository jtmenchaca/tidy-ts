# Companion to factor.test.ts — coxph with factor predictors
# Usage (from this directory): Rscript factor-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "source-tests", "r-json-emit.R"))

options(na.action="na.exclude")
options(contrasts=c('contr.treatment', 'contr.poly'))

tfit <- coxph(Surv(time, status) ~ age + factor(ph.ecog), lung)
p1 <- predict(tfit, type='risk')

result <- list(
  fit_coef = as.vector(coef(tfit)),
  fit_loglik = tfit$loglik,
  fit_var = as.vector(tfit$var),
  fit_lp = as.vector(predict(tfit, type='lp')),
  fit_risk = as.vector(p1),
  coef_names = names(coef(tfit))
)
emit_reference(result)
