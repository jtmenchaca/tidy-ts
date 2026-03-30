# Companion to book7.test.ts — exact partial likelihood, dataset 1 + lung MV.
# Usage (from this directory): Rscript book7-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "source-tests", "r-json-emit.R"))

test1 <- data.frame(
  time = c(9, 3, 1, 1, 6, 6, 8),
  status = c(1, NA, 1, 0, 1, 1, 0),
  x = c(0, 2, 1, 1, 1, 0, 0)
)

fit0 <- coxph(Surv(time, status) ~ x, test1, iter = 0, method = "exact")
fit1 <- coxph(Surv(time, status) ~ x, test1, iter = 1, method = "exact")
fit2 <- tryCatch(
  coxph(Surv(time, status) ~ x, test1, method = "exact"),
  warning = function(w) suppressWarnings(coxph(Surv(time, status) ~ x, test1, method = "exact"))
)

mart0_raw <- resid(fit0)
mart0 <- mart0_raw[!is.na(mart0_raw)]
mart1_raw <- resid(fit1)
mart1 <- mart1_raw[!is.na(mart1_raw)]
mart2_raw <- resid(fit2)
mart2 <- mart2_raw[!is.na(mart2_raw)]

zz <- rep(0, nrow(lung))
fit_rc <- coxph(Surv(time, status) ~ age + ph.ecog + sex, lung, method = "exact")
fit_cp <- coxph(Surv(zz, time, status) ~ age + ph.ecog + sex, lung, method = "exact")

result <- list(
  fit0_loglik = fit0$loglik[1],
  fit0_var = fit0$var[1, 1],
  fit0_coef = as.vector(coef(fit0)),
  fit0_mart = as.vector(mart0),
  fit1_coef = as.vector(coef(fit1)),
  fit1_loglik = fit1$loglik[2],
  fit1_var = fit1$var[1, 1],
  fit1_mart = as.vector(mart1),
  fit2_coef = as.vector(coef(fit2)),
  fit2_mart = as.vector(mart2),
  mv_rc_coef = as.vector(coef(fit_rc)),
  mv_rc_loglik = fit_rc$loglik,
  mv_rc_var = as.vector(fit_rc$var),
  mv_rc_score = fit_rc$score,
  mv_cp_coef = as.vector(coef(fit_cp)),
  mv_cp_loglik = fit_cp$loglik,
  mv_cp_var = as.vector(fit_cp$var),
  mv_cp_score = fit_cp$score
)
emit_reference(result)
