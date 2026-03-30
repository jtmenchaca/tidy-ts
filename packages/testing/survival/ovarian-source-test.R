# Companion to ovarian.test.ts — coxph on ovarian dataset
# Usage (from this directory): Rscript ovarian-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "source-tests", "r-json-emit.R"))

options(na.action=na.exclude)
options(contrasts=c('contr.treatment', 'contr.poly'))

# Full model with all 4 predictors
fit <- coxph(Surv(futime, fustat) ~ age + resid.ds + rx + ecog.ps, data=ovarian)
mart <- resid(fit, type = "mart")
dev <- resid(fit, type = "dev")
score_r <- resid(fit, type = "scor")
scho_r <- resid(fit, type = "scho")

# Stratified model
fit_strat <- coxph(Surv(futime, fustat) ~ age + ecog.ps + strata(rx), data=ovarian)

# Offset model
fit1 <- coxph(Surv(futime, fustat) ~ age + rx, ovarian,
              control=coxph.control(eps=1e-8))
fit2 <- coxph(Surv(futime, fustat) ~ age + offset(rx*fit1$coef[2]), ovarian,
              control=coxph.control(eps=1e-8))

result <- list(
  fit_coef = as.vector(coef(fit)),
  fit_loglik = fit$loglik,
  fit_var = as.vector(fit$var),
  fit_mart = as.vector(mart),
  fit_dev = as.vector(dev),
  fit_score = as.vector(score_r),
  fit_scho = as.vector(scho_r),
  fit_scho_time = as.numeric(names(scho_r[,1])),
  fit_strat_coef = as.vector(coef(fit_strat)),
  fit_strat_loglik = fit_strat$loglik,
  fit1_coef = as.vector(coef(fit1)),
  fit2_coef = as.vector(coef(fit2)),
  fit1_age_coef = fit1$coef[1]
)
emit_reference(result)
