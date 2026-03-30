# Companion to r_lung.test.ts — parametric survreg with strata on lung data (Tier 4)
# Usage (from this directory): Rscript r_lung-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "source-tests", "r-json-emit.R"))

# survreg with strata on lung data
lfit2 <- survreg(Surv(time, status) ~ age + ph.ecog + strata(sex), lung)

result <- list(
  coef = as.vector(lfit2$coefficients),
  loglik = lfit2$loglik,
  scale = lfit2$scale
)
emit_reference(result)
