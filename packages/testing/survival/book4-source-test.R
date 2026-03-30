# Companion to book4.test.ts — T&G dataset 2 counting process, Efron.
# Usage (from this directory): Rscript book4-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "source-tests", "r-json-emit.R"))

test2 <- data.frame(
  start = c(1, 2, 5, 2, 1, 7, 3, 4, 8, 8),
  stop = c(2, 3, 6, 7, 8, 9, 9, 9, 14, 17),
  event = c(1, 1, 1, 1, 1, 1, 1, 0, 0, 0),
  x = c(1, 0, 0, 1, 0, 1, 1, 1, 0, 0)
)

fit0 <- coxph(Surv(start, stop, event) ~ x, test2, iter = 0)
mart0 <- resid(fit0, type = "mart")
score0 <- resid(fit0, type = "score")
scho0 <- resid(fit0, type = "scho")

fit <- coxph(Surv(start, stop, event) ~ x, test2, eps = 1e-8, nocenter = NULL)
mart <- resid(fit, type = "mart")
score_r <- resid(fit, type = "score")
scho_r <- resid(fit, type = "scho")

result <- list(
  fit0_loglik = fit0$loglik[1],
  fit0_var = fit0$var[1, 1],
  fit0_coef = as.vector(coef(fit0)),
  fit0_mart = as.vector(mart0),
  fit0_score = as.vector(score0),
  fit0_scho = as.vector(scho0),
  fit0_scho_time = as.numeric(names(scho0)),
  fit_coef = as.vector(coef(fit)),
  fit_loglik = fit$loglik,
  fit_var = fit$var[1, 1],
  fit_mart = as.vector(mart),
  fit_score = as.vector(score_r),
  fit_scho = as.vector(scho_r),
  fit_scho_time = as.numeric(names(scho_r))
)
emit_reference(result)
