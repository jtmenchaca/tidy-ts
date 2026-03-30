# Companion to doweight.test.ts — weighted Cox Breslow/Efron + replication.
# Usage (from this directory): Rscript doweight-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "source-tests", "r-json-emit.R"))

testw1 <- data.frame(
  time = c(1, 1, 2, 2, 2, 2, 3, 4, 5),
  status = c(1, 0, 1, 1, 1, 0, 0, 1, 0),
  x = c(2, 0, 1, 1, 0, 1, 0, 1, 0),
  wt = c(1, 2, 3, 4, 3, 2, 1, 2, 1)
)
xx <- testw1$wt
testw2 <- data.frame(
  time = rep(testw1$time, xx),
  status = rep(testw1$status, xx),
  x = rep(testw1$x, xx),
  id = rep(1:9, xx)
)

fit0 <- coxph(
  Surv(time, status) ~ x, testw1, weights = wt,
  method = "breslow", iter = 0
)
fit_b <- coxph(Surv(time, status) ~ x, testw1, weights = wt, method = "breslow")
fitb_rep <- coxph(Surv(time, status) ~ x, testw2, method = "breslow")

mart0 <- resid(fit0, type = "mart")
mart_b <- resid(fit_b, type = "mart")
score0 <- resid(fit0, type = "score")
scho0 <- resid(fit0, type = "scho")
score_b <- resid(fit_b, type = "score")
scho_b <- resid(fit_b, type = "scho")

fit0_e <- coxph(Surv(time, status) ~ x, testw1, weights = wt, iter = 0)
fit_e <- coxph(Surv(time, status) ~ x, testw1, weights = wt)

mart0_e <- resid(fit0_e, type = "mart")
mart_e <- resid(fit_e, type = "mart")
score_e <- resid(fit_e, type = "score")
scho_e <- resid(fit_e, type = "scho")

lfun <- function(beta) {
  r <- exp(beta)
  a <- 7 * r + 3
  b <- 4 * r + 2
  11 * beta - (log(r^2 + 11 * r + 7) +
    (10 / 3) * (log(a + b) + log(2 * a / 3 + b) + log(a / 3 + b)) + 2 * log(2 * r + 1))
}

surv_w <- survfit(fit0, newdata = list(x = 0))
surv_rep <- survfit(
  coxph(Surv(time, status) ~ x, testw2, method = "breslow", iter = 0),
  newdata = list(x = 0)
)

result <- list(
  b0_coef = as.vector(coef(fit0)),
  b0_loglik = fit0$loglik[1],
  b0_var = fit0$var[1, 1],
  b0_mart = as.vector(mart0),
  b0_score = as.vector(score0),
  b0_scho = as.vector(scho0),
  b0_scho_time = as.numeric(names(scho0)),
  b_coef = as.vector(coef(fit_b)),
  b_loglik = fit_b$loglik,
  b_var = fit_b$var[1, 1],
  b_mart = as.vector(mart_b),
  b_score = as.vector(score_b),
  b_scho = as.vector(scho_b),
  b_scho_time = as.numeric(names(scho_b)),
  b_rep_coef = as.vector(coef(fitb_rep)),
  b_rep_loglik = fitb_rep$loglik,
  e0_loglik = fit0_e$loglik[1],
  e0_var = fit0_e$var[1, 1],
  e0_mart = as.vector(mart0_e),
  e_coef = as.vector(coef(fit_e)),
  e_loglik = fit_e$loglik,
  e_var = fit_e$var[1, 1],
  e_mart = as.vector(mart_e),
  e_score = as.vector(score_e),
  e_scho = as.vector(scho_e),
  e_scho_time = as.numeric(names(scho_e)),
  efron_loglik_0 = lfun(0),
  efron_loglik_conv = lfun(as.vector(coef(fit_e))),
  surv_w_surv = surv_w$surv,
  surv_rep_surv = surv_rep$surv
)
emit_reference(result)
