# Companion to book3.test.ts — T&G dataset 2 counting process, Breslow.
# Usage (from this directory): Rscript book3-source-test.R

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

fit0 <- coxph(Surv(start, stop, event) ~ x, test2, iter = 0, method = "breslow")
mart0 <- resid(fit0, type = "mart")
score0 <- resid(fit0, type = "score")
scho0 <- resid(fit0, type = "scho")

sfit0 <- survfit(fit0, list(x = 0), censor = FALSE)

fit1 <- coxph(Surv(start, stop, event) ~ x, test2, iter = 1, method = "breslow")

fit <- coxph(
  Surv(start, stop, event) ~ x, test2,
  eps = 1e-8, method = "breslow",
  nocenter = NULL
)
mart <- resid(fit, type = "mart")
score_r <- resid(fit, type = "score")
scho_r <- resid(fit, type = "scho")

sfit <- survfit(fit, list(x = 0), censor = FALSE)

result <- list(
  fit0_loglik = fit0$loglik[1],
  fit0_var = fit0$var[1, 1],
  fit0_coef = as.vector(coef(fit0)),
  fit0_score_test = fit0$score,
  fit0_mart = as.vector(mart0),
  fit0_score = as.vector(score0),
  fit0_scho = as.vector(scho0),
  fit0_scho_time = as.numeric(names(scho0)),
  sfit0_surv = sfit0$surv,
  sfit0_stderr_sq = sfit0$std.err^2,
  sfit0_time = sfit0$time,
  fit1_coef = as.vector(coef(fit1)),
  fit_coef = as.vector(coef(fit)),
  fit_loglik = fit$loglik,
  fit_var = fit$var[1, 1],
  fit_mart = as.vector(mart),
  fit_score = as.vector(score_r),
  fit_scho = as.vector(scho_r),
  fit_scho_time = as.numeric(names(scho_r)),
  sfit_surv = sfit$surv,
  sfit_stderr_sq = sfit$std.err^2,
  sfit_cumhaz = sfit$cumhaz,
  sfit_time = sfit$time
)
emit_reference(result)
