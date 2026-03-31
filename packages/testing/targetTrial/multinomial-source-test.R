# Companion to multinomial.test.ts — multinomial treatment models
# Usage: Rscript multinomial-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "r-json-emit.R"))

# ── Multinomial ITT (3-level treatment) ──
data <- data.table::copy(SEQdata.multitreatment)
model_multi_itt <- SEQuential(data, "ID", "time", "eligible", "tx_init", "outcome",
  list("N", "L", "P"), list("sex"),
  method = "ITT",
  options = SEQopts(multinomial = TRUE, treat.level = c(0, 1, 2)),
  verbose = FALSE)

multi_itt_coefs <- as.vector(coef(model_multi_itt@outcome.model[[1]][[1]]))
multi_itt_names <- names(coef(model_multi_itt@outcome.model[[1]][[1]]))
multi_itt_covs <- covariates(model_multi_itt)

# ── Multinomial Censoring Pre-Expansion ──
data <- data.table::copy(SEQdata.multitreatment)
model_multi_cens_pre <- suppressWarnings(SEQuential(data, "ID", "time", "eligible", "tx_init", "outcome",
  list("N", "L", "P"), list("sex"),
  method = "censoring",
  options = SEQopts(multinomial = TRUE, treat.level = c(0, 1, 2), weighted = TRUE),
  verbose = FALSE))

multi_cens_pre_coefs <- as.vector(coef(model_multi_cens_pre@outcome.model[[1]][[1]]))
multi_cens_pre_names <- names(coef(model_multi_cens_pre@outcome.model[[1]][[1]]))

# ── Multinomial Censoring Post-Expansion ──
data <- data.table::copy(SEQdata.multitreatment)
model_multi_cens_post <- suppressWarnings(SEQuential(data, "ID", "time", "eligible", "tx_init", "outcome",
  list("N", "L", "P"), list("sex"),
  method = "censoring",
  options = SEQopts(multinomial = TRUE, treat.level = c(0, 1, 2),
    weighted = TRUE, weight.preexpansion = FALSE),
  verbose = FALSE))

multi_cens_post_coefs <- as.vector(coef(model_multi_cens_post@outcome.model[[1]][[1]]))
multi_cens_post_names <- names(coef(model_multi_cens_post@outcome.model[[1]][[1]]))

result <- list(
  # Multinomial ITT (3-level)
  multi_itt_coef_names = multi_itt_names,
  multi_itt_coef_values = multi_itt_coefs,
  multi_itt_outcome_formula = multi_itt_covs$Outcome,

  # Multinomial Censoring Pre-Expansion
  multi_cens_pre_coef_names = multi_cens_pre_names,
  multi_cens_pre_coef_values = multi_cens_pre_coefs,

  # Multinomial Censoring Post-Expansion
  multi_cens_post_coef_names = multi_cens_post_names,
  multi_cens_post_coef_values = multi_cens_post_coefs
)

emit_reference(result)
