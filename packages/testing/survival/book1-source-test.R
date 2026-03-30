# Companion to book1.test.ts — Therneau & Grambsch appendix data set 1, Breslow.
# Usage (from this directory): Rscript book1-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "source-tests", "r-json-emit.R"))

# ── book1: Breslow estimate, dataset 1 ──
test1 <- data.frame(
  time = c(9, 3, 1, 1, 6, 6, 8),
  status = c(1, NA, 1, 0, 1, 1, 0),
  x = c(0, 2, 1, 1, 1, 0, 0)
)

fit0 <- coxph(Surv(time, status) ~ x, test1, iter = 0, method = "breslow")
fit1 <- coxph(Surv(time, status) ~ x, test1, iter = 1, method = "breslow")
fit <- coxph(
  Surv(time, status) ~ x, test1,
  method = "breslow", eps = 1e-8, nocenter = NULL
)

mart <- resid(fit, type = "mart")
score_r <- resid(fit, type = "score")
scho_r <- resid(fit, type = "scho")

sfit_censor <- survfit(fit, list(x = 0), censor = TRUE)
sfit_nocensor <- survfit(fit, list(x = 0), censor = FALSE)

mart0 <- resid(fit0, type = "mart")
score0 <- resid(fit0, type = "score")
scho0 <- resid(fit0, type = "scho")

sfit0 <- survfit(fit0, list(x = 0))

result <- list(
  fit0_loglik = fit0$loglik[1],
  fit0_var = fit0$var[1, 1],
  fit0_coef = as.vector(coef(fit0)),
  fit0_mart = as.vector(mart0),
  fit0_score = as.vector(score0),
  fit0_scho = as.vector(scho0),
  fit0_scho_time = as.numeric(names(scho0)),
  sfit0_cumhaz = sfit0$cumhaz,
  sfit0_surv = sfit0$surv,
  sfit0_stderr_sq = sfit0$std.err^2,
  sfit0_time = sfit0$time,
  fit1_coef = as.vector(coef(fit1)),
  fit_coef = as.vector(coef(fit)),
  fit_loglik = fit$loglik,
  fit_var = fit$var[1, 1],
  fit_means = fit$means,
  fit_mart = as.vector(mart),
  fit_score = as.vector(score_r),
  fit_scho = as.vector(scho_r),
  fit_scho_time = as.numeric(names(scho_r)),
  sfit_surv = sfit_censor$surv,
  sfit_cumhaz = sfit_censor$cumhaz,
  sfit_stderr_sq = sfit_censor$std.err^2,
  sfit_time = sfit_censor$time,
  sfit_nc_surv = sfit_nocensor$surv,
  sfit_nc_stderr_sq = sfit_nocensor$std.err^2,
  sfit_nc_time = sfit_nocensor$time
)
emit_reference(result)
