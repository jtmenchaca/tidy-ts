# Companion to bladder.test.ts — Wei et al models on bladder cancer data
# Usage (from this directory): Rscript bladder-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "source-tests", "r-json-emit.R"))

# ── Wei model: strata-by-covariate interactions ──────────────────────────────
# bladder.R L5: coxph(Surv(stop, event) ~ (rx + size + number)*strata(enum),
#               cluster=id, bladder, ties='breslow')
wei <- coxph(Surv(stop, event) ~ (rx + size + number) * strata(enum),
             cluster = id, data = bladder, ties = "breslow")

# ── Anderson-Gill counting process model ─────────────────────────────────────
# bladder.R L13: coxph(Surv(start, stop, event) ~ rx + size + number,
#                cluster=id, bladder2, ties='breslow')
ag <- coxph(Surv(start, stop, event) ~ rx + size + number,
            cluster = id, data = bladder2, ties = "breslow")

# ── Prentice conditional model (first recurrence only) ───────────────────────
# bladder.R L18: coxph(Surv(stop, event) ~ rx + size + number,
#                bladder2, subset=(enum==1), ties='breslow')
prentice1 <- coxph(Surv(stop, event) ~ rx + size + number,
                   data = bladder2, subset = (enum == 1), ties = "breslow")

result <- list(
  # Wei model
  wei_coef       = as.vector(coef(wei)),
  wei_coef_names = names(coef(wei)),
  wei_loglik     = wei$loglik,
  wei_n          = wei$n,
  wei_nevent     = wei$nevent,

  # Anderson-Gill model
  ag_coef       = as.vector(coef(ag)),
  ag_coef_names = names(coef(ag)),
  ag_loglik     = ag$loglik,
  ag_n          = ag$n,
  ag_nevent     = ag$nevent,

  # Prentice model (enum==1 subset)
  prentice1_coef       = as.vector(coef(prentice1)),
  prentice1_coef_names = names(coef(prentice1)),
  prentice1_loglik     = prentice1$loglik,
  prentice1_n          = prentice1$n,
  prentice1_nevent     = prentice1$nevent
)
emit_reference(result)
