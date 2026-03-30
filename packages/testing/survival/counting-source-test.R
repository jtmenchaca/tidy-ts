# Companion to counting.test.ts — counting process vs right-censored equivalence.
# Usage (from this directory): Rscript counting-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "source-tests", "r-json-emit.R"))

# ── counting: same result as right-censored ──
options(na.action = na.exclude)
test1 <- data.frame(
  time = c(9, 3, 1, 1, 6, 6, 8),
  status = c(1, NA, 1, 0, 1, 1, 0),
  x = c(0, 2, 1, 1, 1, 0, 0)
)
test1b_full <- data.frame(
  start = c(0, 3, 0, 0, 5, 0, 6, 14, 0, 0, 10, 20, 30, 0),
  stop       = c(3, 10, 10, 5, 20, 6, 14, 20, 30, 10, 20, 30, 40, 10),
  status = c(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0),
  x = c(1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, NA),
  id = c(3, 3, 4, 5, 5, 6, 6, 6, 7, 1, 1, 1, 1, 2)
)

fit0 <- coxph(Surv(time, status) ~ x, test1, iter = 0)
fit <- coxph(Surv(time, status) ~ x, test1)

fit0b <- coxph(Surv(start, stop, status) ~ x, test1b_full, iter = 0)
fitb <- coxph(Surv(start, stop, status) ~ x, test1b_full)

mart0_raw <- resid(fit0)
mart0 <- mart0_raw[!is.na(mart0_raw)]
mart_raw <- resid(fit)
mart <- mart_raw[!is.na(mart_raw)]
score0_raw <- resid(fit0, type = "score")
score0 <- score0_raw[!is.na(score0_raw)]
score_raw <- resid(fit, type = "score")
score <- score_raw[!is.na(score_raw)]
scho0 <- resid(fit0, type = "scho")
scho <- resid(fit, type = "scho")

mart0b_all <- resid(fit0b)
mart0b_raw <- mart0b_all[!is.na(mart0b_all)]
martb_all <- resid(fitb)
martb_raw <- martb_all[!is.na(martb_all)]
score0b_all <- resid(fit0b, type = "score")
score0b_raw <- score0b_all[!is.na(score0b_all)]
scoreb_all <- resid(fitb, type = "score")
scoreb_raw <- scoreb_all[!is.na(scoreb_all)]
scho0b <- resid(fit0b, type = "scho")
schob <- resid(fitb, type = "scho")

mart0b_col <- resid(fit0b, collapse = test1b_full$id)
mart0b_col <- mart0b_col[!is.na(mart0b_col)]
martb_col <- resid(fitb, collapse = test1b_full$id)
martb_col <- martb_col[!is.na(martb_col)]

result <- list(
  fit0_coef = as.vector(coef(fit0)),
  fit_coef = as.vector(coef(fit)),
  fit_loglik = fit$loglik,
  fit_var = fit$var[1, 1],
  fit0b_coef = as.vector(coef(fit0b)),
  fitb_coef = as.vector(coef(fitb)),
  fitb_loglik = fitb$loglik,
  fitb_var = fitb$var[1, 1],
  mart0 = as.vector(mart0),
  mart = as.vector(mart),
  score0 = as.vector(score0),
  score = as.vector(score),
  scho0 = as.vector(scho0),
  scho0_time = as.numeric(names(scho0)),
  scho = as.vector(scho),
  scho_time = as.numeric(names(scho)),
  mart0b_raw = as.vector(mart0b_raw),
  martb_raw = as.vector(martb_raw),
  score0b_raw = as.vector(score0b_raw),
  scoreb_raw = as.vector(scoreb_raw),
  scho0b = as.vector(scho0b),
  scho0b_time = as.numeric(names(scho0b)),
  schob = as.vector(schob),
  schob_time = as.numeric(names(schob)),
  mart0b_col = as.vector(mart0b_col),
  martb_col = as.vector(martb_col)
)
emit_reference(result)
