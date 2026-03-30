# Companion to difftest.test.ts — survdiff aml, aml3, stratified lung.
# Usage (from this directory): Rscript difftest-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "source-tests", "r-json-emit.R"))

aml3 <- data.frame(
  time = c(
    9, 13, 13, 18, 23, 28, 31, 34, 45, 48, 161,
    5, 5, 8, 8, 12, 16, 23, 27, 30, 33, 43, 45,
    1, 2, 2, 3, 3, 3, 4
  ),
  status = c(
    1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0,
    1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1,
    0, 0, 0, 0, 0, 0, 0
  ),
  x = factor(c(
    rep("Maintained", 11), rep("Nonmaintained", 12), rep("Dummy", 7)
  ))
)

sd_aml <- survdiff(Surv(time, status) ~ x, aml)
sd_aml3 <- survdiff(Surv(time, status) ~ x, aml3)

tdata <- na.omit(lung[, c("time", "status", "pat.karno", "inst")])
sd_lung <- survdiff(Surv(time, status) ~ pat.karno + strata(inst), tdata)

cfit <- coxph(
  Surv(time, status) ~ factor(pat.karno) + strata(inst),
  tdata, iter = 0
)

result <- list(
  aml_chisq = sd_aml$chisq,
  aml_n = as.vector(sd_aml$n),
  aml_obs = as.vector(sd_aml$obs),
  aml_exp = as.vector(sd_aml$exp),
  aml3_chisq = sd_aml3$chisq,
  aml3_n = as.vector(sd_aml3$n),
  aml3_obs = as.vector(sd_aml3$obs),
  aml3_exp = as.vector(sd_aml3$exp),
  lung_chisq = sd_lung$chisq,
  lung_n = as.vector(sd_lung$n),
  lung_obs = as.vector(sd_lung$obs),
  lung_exp = as.vector(sd_lung$exp),
  lung_var = matrix(sd_lung$var, nrow = nrow(sd_lung$var)),
  lung_pat_karno_levels = as.integer(sort(unique(tdata$pat.karno))),
  lung_coxvar = matrix(cfit$var, nrow = nrow(cfit$var)),
  lung_coxvar_inv = matrix(solve(cfit$var), nrow = nrow(cfit$var))
)
emit_reference(result)
