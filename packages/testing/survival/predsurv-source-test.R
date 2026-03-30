# Companion to predsurv.test.ts — predict(coxfit) agrees with survfit for expected/survival
# Usage (from this directory): Rscript predsurv-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "source-tests", "r-json-emit.R"))

options(na.action = na.exclude)

fit1 <- coxph(Surv(time, status) ~ age + ph.ecog, lung)

result <- list(
  coef = as.vector(coef(fit1)),
  loglik = fit1$loglik,
  n = fit1$n,
  nevent = fit1$nevent,
  means = fit1$means,
  var_diag = diag(fit1$var)
)
emit_reference(result)
