# Companion to detail.test.ts — coxph.detail / Breslow hazard at init beta.
# Usage (from this directory): Rscript detail-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "source-tests", "r-json-emit.R"))

# ── detail: counting-process hazard detail ──
test2 <- data.frame(
  start = c(1, 2, 5, 2, 1, 7, 3, 4, 8, 8),
  stop = c(2, 3, 6, 7, 8, 9, 9, 9, 14, 17),
  event = c(1, 1, 1, 1, 1, 1, 1, 0, 0, 0),
  x = c(1, 0, 0, 1, 0, 1, 1, 1, 0, 0)
)

fit1 <- coxph(Surv(start, stop, event) ~ x, test2, init = -1, iter = 0)
temp <- coxph.detail(fit1)

r <- exp(-1)
hazard <- c(
  1 / (r + 1), 1 / (r + 2), 1 / (3 * r + 2), 1 / (3 * r + 1), 1 / (3 * r + 1),
  1 / (3 * r + 2), 1 / (2 * r + 2)
)
detail_haz <- c(hazard[1:5], sum(hazard[6:7]))

loglik_val <- 4 * (-1) - (
  log(r + 1) + log(r + 2) + 2 * log(3 * r + 2) + 2 * log(3 * r + 1) +
  log(2 * r + 2)
)
u_val <- (
  1 / (r + 1) + 1 / (3 * r + 1) + 2 * (1 / (3 * r + 2) + 1 / (2 * r + 2)) -
  (r / (r + 2) + 3 * r / (3 * r + 2) + 3 * r / (3 * r + 1))
)
imat_val <- r * (
  1 / (r + 1)^2 + 2 / (r + 2)^2 + 6 / (3 * r + 2)^2 +
  6 / (3 * r + 1)^2 + 6 / (3 * r + 2)^2 + 4 / (2 * r + 2)^2
)

mart <- resid(fit1, type = "mart")
score_r <- resid(fit1, type = "score")
scho_r <- resid(fit1, type = "scho")

result <- list(
  coef = as.vector(coef(fit1)),
  loglik = fit1$loglik,
  var = fit1$var[1, 1],
  means = fit1$means,
  detail_haz = as.vector(temp$hazard),
  byhand_haz = as.vector(detail_haz),
  detail_time = as.vector(temp$time),
  byhand_loglik = loglik_val,
  byhand_u = u_val,
  byhand_imat = imat_val,
  mart = as.vector(mart),
  score = as.vector(score_r),
  scho = as.vector(scho_r),
  scho_time = as.numeric(names(scho_r))
)
emit_reference(result)
