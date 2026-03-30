# Companion to jasa.test.ts — Stanford heart transplant counting-process models
# Usage (from this directory): Rscript jasa-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "source-tests", "r-json-emit.R"))

# ── Counting-process Cox with interactions ───────────────────────────────────
# jasa.R L16: coxph(Surv(start, stop, event) ~ (age + surgery)*transplant,
#             jasa1, method='breslow')
sfit1 <- coxph(Surv(start, stop, event) ~ (age + surgery) * transplant,
               data = jasa1, method = "breslow")

# ── Simple age model on jasa ─────────────────────────────────────────────────
# jasa.R L36: coxph(Surv(futime, fustat) ~ I(age -48), data=jasa)
fit1 <- coxph(Surv(futime, fustat) ~ I(age - 48), data = jasa)

result <- list(
  # Counting-process model with interactions (sfit.1)
  sfit1_coef       = as.vector(coef(sfit1)),
  sfit1_coef_names = names(coef(sfit1)),
  sfit1_loglik     = sfit1$loglik,
  sfit1_n          = sfit1$n,
  sfit1_nevent     = sfit1$nevent,

  # Simple age model (fit1)
  fit1_coef       = as.vector(coef(fit1)),
  fit1_coef_names = names(coef(fit1)),
  fit1_loglik     = fit1$loglik,
  fit1_n          = fit1$n,
  fit1_nevent     = fit1$nevent
)
emit_reference(result)
