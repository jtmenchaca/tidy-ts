# Companion to coxsurv.test.ts — survfit from Cox model on lung.
# Usage (from this directory): Rscript coxsurv-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "source-tests", "r-json-emit.R"))

options(na.action = na.exclude)

# Simple model for basic survfit-from-Cox validation
tdata2 <- na.omit(lung[, c('time', 'status', 'age', 'sex')])
fit2 <- coxph(Surv(time, status) ~ age + sex, data = tdata2)
surv2 <- survfit(fit2)

# Offset test (cancer.R L56-69)
fit_a <- coxph(Surv(time, status) ~ age + ph.ecog, lung)
eta <- cbind(lung$age, lung$ph.ecog) %*% coef(fit_a)
fit_offset <- coxph(Surv(time, status) ~ offset(eta), lung)

result <- list(
  simple_coef = as.vector(coef(fit2)),
  simple_time = surv2$time,
  simple_surv = surv2$surv,
  simple_cumhaz = surv2$cumhaz,
  simple_std_err = surv2$std.err,
  simple_n = surv2$n,
  offset_loglik_match = as.vector(fit_a$loglik[2]),
  offset_loglik = as.vector(fit_offset$loglik)
)
emit_reference(result)
