# Companion to overlap.test.ts — counting-process coxph with non-overlapping observation
# Usage (from this directory): Rscript overlap-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "source-tests", "r-json-emit.R"))

test2 <- data.frame(
  time1 = c(1, 2, 5, 2, 1, 7, 3, 4, 8, 8, 3),
  time2 = c(2, 3, 6, 7, 8, 9, 9, 9, 14, 17, 5),
  event = c(1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0),
  x     = c(1, 0, 0, 1, 0, 1, 1, 1, 0, 0, 500)
)

# fit1: subset excluding the wild observation (x<100)
fit1 <- coxph(Surv(time1, time2, event) ~ x, test2, subset=(x<100))
# fit2: full dataset (wild obs has no overlap with event times)
fit2 <- coxph(Surv(time1, time2, event) ~ x, test2)

result <- list(
  fit1_coef = as.vector(coef(fit1)),
  fit1_loglik = fit1$loglik,
  fit1_var = fit1$var[1, 1],
  fit1_score = fit1$score,
  fit1_resid = as.vector(fit1$residuals),
  fit2_coef = as.vector(coef(fit2)),
  fit2_loglik = fit2$loglik,
  fit2_var = fit2$var[1, 1],
  fit2_score = fit2$score,
  fit2_resid = as.vector(fit2$residuals)
)
emit_reference(result)
