# Companion to book5.test.ts — weighted Cox Breslow (T&G §1.3).
# Usage (from this directory): Rscript book5-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "source-tests", "r-json-emit.R"))

testw1 <- data.frame(
  time = c(1, 1, 2, 2, 2, 2, 3, 4, 5),
  status = c(1, 0, 1, 1, 1, 0, 0, 1, 0),
  x = c(2, 0, 1, 1, 0, 1, 0, 1, 0),
  wt = c(1, 2, 3, 4, 3, 2, 1, 2, 1),
  id = 1:9
)
testw2 <- testw1[rep(1:9, testw1$wt), -4]
row.names(testw2) <- NULL
indx <- match(1:9, testw2$id)

fit0 <- coxph(
  Surv(time, status) ~ x, testw1, weights = wt,
  method = "breslow", iter = 0
)
fit0b <- coxph(Surv(time, status) ~ x, testw2, method = "breslow", iter = 0)

fit <- coxph(Surv(time, status) ~ x, testw1, weights = wt, method = "breslow")
fitb <- coxph(Surv(time, status) ~ x, testw2, method = "breslow")

mart0 <- resid(fit0, type = "mart")
score0 <- resid(fit0, type = "score")
scho0 <- resid(fit0, type = "scho")

mart_r <- resid(fit, type = "mart")
score_r <- resid(fit, type = "score")
scho_r <- resid(fit, type = "scho")

martb <- resid(fitb, type = "mart")
scoreb <- resid(fitb, type = "score")
schob <- resid(fitb, type = "scho")

mart_wt <- resid(fit, type = "mart", weighted = TRUE)
score_wt <- resid(fit, type = "score", weighted = TRUE)

sfit0 <- survfit(fit0, list(x = pi), censor = FALSE)
sfit <- survfit(fit, list(x = 0.3), censor = FALSE)

result <- list(
  fit0_loglik = fit0$loglik[1],
  fit0_var = fit0$var[1, 1],
  fit0_coef = as.vector(coef(fit0)),
  fit0_mart = as.vector(mart0),
  fit0_score = as.vector(score0),
  fit0_scho = as.vector(scho0),
  fit0_scho_time = as.numeric(names(scho0)),
  sfit0_surv = sfit0$surv,
  sfit0_stderr_sq = sfit0$std.err^2,
  sfit0_cumhaz = sfit0$cumhaz,
  sfit0_time = sfit0$time,
  fit_coef = as.vector(coef(fit)),
  fit_loglik = fit$loglik,
  fit_var = fit$var[1, 1],
  fit_mart = as.vector(mart_r),
  fit_score = as.vector(score_r),
  fit_scho = as.vector(scho_r),
  fit_scho_time = as.numeric(names(scho_r)),
  sfit_surv = sfit$surv,
  sfit_stderr_sq = sfit$std.err^2,
  sfit_cumhaz = sfit$cumhaz,
  sfit_time = sfit$time,
  fit0b_mart = as.vector(resid(fit0b, type = "mart")[indx]),
  fit0b_score = as.vector(resid(fit0b, type = "score")[indx]),
  fitb_mart = as.vector(martb[indx]),
  fitb_score = as.vector(scoreb[indx]),
  mart_wt = as.vector(mart_wt),
  score_wt = as.vector(score_wt)
)
emit_reference(result)
