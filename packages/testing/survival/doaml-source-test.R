# Companion to doaml.test.ts — AML Cox, KM, survdiff, offsets, Efron.
# Usage (from this directory): Rscript doaml-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "source-tests", "r-json-emit.R"))

fit_b <- coxph(Surv(aml$time, aml$status) ~ aml$x, method = "breslow")
mart <- resid(fit_b, type = "mart")
score_resid <- resid(fit_b, type = "score")
scho_resid <- resid(fit_b, type = "scho")

fit2 <- coxph(Surv(time, status) ~ x - 1, method = "breslow", data = aml)

km_strat <- survfit(Surv(aml$time, aml$status) ~ aml$x)

sd <- survdiff(Surv(aml$time, aml$status) ~ aml$x)

km <- survfit(Surv(time, status) ~ 1, aml)

tfit <- coxph(Surv(aml$time, aml$status) ~ offset(log(1:23)))
sfit <- survfit(tfit, stype = 2, ctype = 1, censor = FALSE)
rscore <- exp(log(1:23) - mean(log(1:23)))[order(aml$time)]
atime <- sort(aml$time)
denom <- rev(cumsum(rev(rscore)))
denom <- denom[match(unique(atime), atime)]
deaths <- tapply(aml$status, aml$time, sum)
chaz <- cumsum(deaths / denom)
hand_surv <- as.vector(exp(-chaz[deaths > 0]))

fit_e <- coxph(Surv(time, status) ~ x, aml, method = "efron")

fit_cp <- coxph(Surv(rep(0, 23), time, status) ~ x, aml, method = "efron")

sfit_efron <- survfit(tfit)

result <- list(
  breslow_coef = as.vector(coef(fit_b)),
  breslow_loglik = fit_b$loglik,
  breslow_var = fit_b$var[1, 1],
  breslow_score = fit_b$score,
  breslow_nevent = fit_b$nevent,
  breslow_mart = as.vector(mart),
  breslow_score_resid = as.vector(score_resid),
  breslow_scho_resid = as.vector(scho_resid),
  breslow_scho_time = as.numeric(names(scho_resid)),
  drop_intercept_loglik = fit2$loglik,
  drop_intercept_coef = as.vector(coef(fit2)),
  drop_intercept_var = fit2$var[1, 1],
  km_time = km$time,
  km_surv = km$surv,
  km_std_err = km$std.err,
  km_strat_time = km_strat$time,
  km_strat_surv = km_strat$surv,
  km_strat_std_err = km_strat$std.err,
  km_strat_strata = as.vector(km_strat$strata),
  survdiff_chisq = sd$chisq,
  survdiff_obs = sd$obs,
  survdiff_exp = sd$exp,
  riskwt_surv = sfit$surv,
  riskwt_time = sfit$time,
  riskwt_hand_surv = hand_surv,
  efron_sfit_surv = sfit_efron$surv,
  efron_sfit_time = sfit_efron$time,
  efron_coef = as.vector(coef(fit_e)),
  efron_loglik = fit_e$loglik,
  cp_efron_coef = as.vector(coef(fit_cp)),
  cp_efron_loglik = fit_cp$loglik
)
emit_reference(result)
