# Companion to infcox.test.ts — near-infinite Cox coefficients.
# Usage (from this directory): Rscript infcox-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "source-tests", "r-json-emit.R"))

test3 <- data.frame(
  futime = 1:12,
  fustat = c(1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0),
  x1 = rep(0:1, 6),
  x2 = c(rep(0, 6), rep(1, 6))
)

fit3 <- suppressWarnings(coxph(Surv(futime, fustat) ~ x1 + x2, test3, iter = 25))

true_loglik <- function(beta) {
  r1 <- exp(beta[1])
  r2 <- exp(beta[2])
  -log(3 * (1 + r1 + r2 + r1 * r2)) - log(2 + 2 * r1 + 3 * r2 + 3 * r1 * r2) -
    log(1 + r1 + 3 * r2 + 3 * r1 * r2)
}

result <- list(
  coef = as.vector(coef(fit3)),
  loglik = fit3$loglik,
  var = as.vector(fit3$var),
  coefs_below_neg22 = all(fit3$coef < -22),
  true_loglik_at_coef = true_loglik(as.vector(coef(fit3)))
)
emit_reference(result)
