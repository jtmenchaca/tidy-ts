# Companion to nested.test.ts — nested survfit calls
# Usage (from this directory): Rscript nested-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "source-tests", "r-json-emit.R"))

myfit <- coxph(Surv(time, status) ~ age + factor(sex), lung)
sf <- survfit(myfit, lung[1:5,])

result <- list(
  fit_coef = as.vector(coef(myfit)),
  fit_loglik = myfit$loglik,
  fit_means = myfit$means,
  fit_var = as.vector(myfit$var),
  sf_time = sf$time,
  sf_surv_1 = sf$surv[,1],
  sf_surv_5 = sf$surv[,5],
  sf_cumhaz_1 = sf$cumhaz[,1],
  sf_cumhaz_5 = sf$cumhaz[,5],
  newdata_age = lung$age[1:5],
  newdata_sex = lung$sex[1:5]
)
emit_reference(result)
