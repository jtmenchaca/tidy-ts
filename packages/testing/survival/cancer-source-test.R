# Companion to cancer.test.ts — coxph on lung with multiple covariates + strata.
# Usage (from this directory): Rscript cancer-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "source-tests", "r-json-emit.R"))

options(na.action = na.exclude)

# Full model from cancer.R L25-26
tdata <- na.omit(lung[, c('time', 'status', 'ph.ecog', 'ph.karno',
                           'pat.karno', 'wt.loss', 'sex', 'age', 'inst')])
cfit1 <- coxph(Surv(time, status) ~ ph.ecog + ph.karno + pat.karno +
                 wt.loss + sex + age + strata(inst), tdata)

# Simpler model without strata for basic validation
tdata2 <- na.omit(lung[, c('time', 'status', 'age', 'sex')])
cfit_simple <- coxph(Surv(time, status) ~ age + sex, tdata2)

# survdiff on lung (cancer.R L18)
sd_inst <- survdiff(Surv(time, status) ~ inst, lung, rho = .5)

result <- list(
  coef = as.vector(coef(cfit1)),
  loglik = cfit1$loglik,
  var_diag = diag(cfit1$var),
  n = cfit1$n,
  nevent = cfit1$nevent,
  coef_names = names(coef(cfit1)),
  simple_coef = as.vector(coef(cfit_simple)),
  simple_loglik = cfit_simple$loglik,
  simple_var = matrix(cfit_simple$var, nrow = 2),
  simple_n = cfit_simple$n,
  simple_nevent = cfit_simple$nevent,
  simple_score = cfit_simple$score,
  sd_inst_chisq = sd_inst$chisq
)
emit_reference(result)
