# Companion to r_resid.test.ts — parametric survreg residuals (Tier 4)
# Usage (from this directory): Rscript r_resid-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "source-tests", "r-json-emit.R"))

# Weibull survreg on ovarian data
fit1 <- survreg(Surv(futime, fustat) ~ age + ecog.ps, ovarian)

result <- list(
  coef = as.vector(fit1$coefficients),
  loglik = fit1$loglik,
  scale = fit1$scale
)
emit_reference(result)
