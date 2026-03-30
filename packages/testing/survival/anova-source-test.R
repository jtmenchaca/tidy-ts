# Companion to anova.test.ts — sequential model comparison via loglik
# Usage (from this directory): Rscript anova-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "source-tests", "r-json-emit.R"))

# Use na.omit to match R's anova behavior
tdata <- na.omit(lung[, c('time', 'status', 'ph.ecog', 'wt.loss', 'sex')])

# Nested models: ph.ecog only → ph.ecog + wt.loss → (strata(sex) doesn't change loglik comparison)
fit3 <- coxph(Surv(time, status) ~ ph.ecog + strata(sex), tdata)
fit2 <- coxph(Surv(time, status) ~ ph.ecog + wt.loss + strata(sex), tdata)

# Sequential anova: null → fit3 → fit2
# anova$loglik = c(null_loglik, fit3_loglik, fit2_loglik)
# anova$Chisq[-1] = 2 * diff(loglik)

result <- list(
  fit3_coef = as.vector(coef(fit3)),
  fit3_loglik = fit3$loglik,
  fit3_var = fit3$var[1, 1],
  fit2_coef = as.vector(coef(fit2)),
  fit2_loglik = fit2$loglik,
  fit2_var = as.vector(fit2$var),
  null_loglik = fit3$loglik[1]
)
emit_reference(result)
