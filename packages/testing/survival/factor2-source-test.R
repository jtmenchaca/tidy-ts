# Companion to factor2.test.ts — coxph with factor predictors (prediction)
# Usage (from this directory): Rscript factor2-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "source-tests", "r-json-emit.R"))

options(na.action=na.exclude)

fit <- coxph(Surv(time, status) ~ factor(ph.ecog), lung)
tdata <- data.frame(ph.ecog = factor(0:3))
p1 <- predict(fit, newdata=tdata, type='lp')

fit2 <- coxph(Surv(time, status) ~ factor(ph.ecog) + factor(sex), lung)

result <- list(
  fit_coef = as.vector(coef(fit)),
  fit_loglik = fit$loglik,
  fit_lp = as.vector(p1),
  fit2_coef = as.vector(coef(fit2)),
  fit2_loglik = fit2$loglik
)
emit_reference(result)
