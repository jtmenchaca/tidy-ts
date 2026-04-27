# Companion to covariates.test.ts — default formula generation
# Tests that auto-generated outcome/numerator/denominator covariates match R
# Usage: Rscript covariates-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "r-json-emit.R"))

# Helper: extract formula components as sorted character vector
# R covariates() returns "outcome ~ tx_init_bas + followup + ..." — strip LHS
formula_components <- function(formula_str) {
  if (is.na(formula_str) || is.null(formula_str)) return(NULL)
  # Strip "outcome ~ " prefix if present
  rhs <- sub("^[^~]+~\\s*", "", formula_str)
  sort(trimws(unlist(strsplit(rhs, "\\+"))))
}

# ── ITT ──
data <- data.table::copy(SEQdata)
model_itt <- SEQuential(data, "ID", "time", "eligible", "tx_init", "outcome",
  list("N", "L", "P"), list("sex"),
  method = "ITT", options = SEQopts(), verbose = FALSE)
itt_covs <- covariates(model_itt)

# ── Pre-Expansion Dose-Response ──
data <- data.table::copy(SEQdata)
model_dr_pre <- suppressWarnings(SEQuential(data, "ID", "time", "eligible", "tx_init", "outcome",
  list("N", "L", "P"), list("sex"),
  method = "dose-response",
  options = SEQopts(weighted = TRUE), verbose = FALSE))
dr_pre_covs <- covariates(model_dr_pre)

# ── Post-Expansion Dose-Response ──
data <- data.table::copy(SEQdata)
model_dr_post <- suppressWarnings(SEQuential(data, "ID", "time", "eligible", "tx_init", "outcome",
  list("N", "L", "P"), list("sex"),
  method = "dose-response",
  options = SEQopts(weighted = TRUE, weight.preexpansion = FALSE), verbose = FALSE))
dr_post_covs <- covariates(model_dr_post)

# ── Pre-Expansion Censoring ──
data <- data.table::copy(SEQdata)
model_cens_pre <- suppressWarnings(SEQuential(data, "ID", "time", "eligible", "tx_init", "outcome",
  list("N", "L", "P"), list("sex"),
  method = "censoring",
  options = SEQopts(weighted = TRUE), verbose = FALSE))
cens_pre_covs <- covariates(model_cens_pre)

# ── Post-Expansion Censoring ──
data <- data.table::copy(SEQdata)
model_cens_post <- suppressWarnings(SEQuential(data, "ID", "time", "eligible", "tx_init", "outcome",
  list("N", "L", "P"), list("sex"),
  method = "censoring",
  options = SEQopts(weighted = TRUE, weight.preexpansion = FALSE), verbose = FALSE))
cens_post_covs <- covariates(model_cens_post)

# ── Pre-Expansion Excused Censoring ──
data <- data.table::copy(SEQdata)
model_exc_pre <- suppressWarnings(SEQuential(data, "ID", "time", "eligible", "tx_init", "outcome",
  list("N", "L", "P"), list("sex"),
  method = "censoring",
  options = SEQopts(weighted = TRUE, excused = TRUE,
    excused.cols = c("excusedZero", "excusedOne")), verbose = FALSE))
exc_pre_covs <- covariates(model_exc_pre)

# ── Post-Expansion Excused Censoring ──
data <- data.table::copy(SEQdata)
model_exc_post <- suppressWarnings(SEQuential(data, "ID", "time", "eligible", "tx_init", "outcome",
  list("N", "L", "P"), list("sex"),
  method = "censoring",
  options = SEQopts(weighted = TRUE, excused = TRUE,
    excused.cols = c("excusedZero", "excusedOne"),
    weight.preexpansion = FALSE, weight.upper = 1), verbose = FALSE))
exc_post_covs <- covariates(model_exc_post)

result <- list(
  # ITT (no numerator/denominator for ITT)
  itt_outcome = formula_components(itt_covs$Outcome),

  # Dose-Response Pre-Expansion
  dr_pre_outcome = formula_components(dr_pre_covs$Outcome),
  dr_pre_numerator = formula_components(dr_pre_covs$Numerator),
  dr_pre_denominator = formula_components(dr_pre_covs$Denominator),

  # Dose-Response Post-Expansion
  dr_post_outcome = formula_components(dr_post_covs$Outcome),
  dr_post_numerator = formula_components(dr_post_covs$Numerator),
  dr_post_denominator = formula_components(dr_post_covs$Denominator),

  # Censoring Pre-Expansion
  cens_pre_outcome = formula_components(cens_pre_covs$Outcome),
  cens_pre_numerator = formula_components(cens_pre_covs$Numerator),
  cens_pre_denominator = formula_components(cens_pre_covs$Denominator),

  # Censoring Post-Expansion
  cens_post_outcome = formula_components(cens_post_covs$Outcome),
  cens_post_numerator = formula_components(cens_post_covs$Numerator),
  cens_post_denominator = formula_components(cens_post_covs$Denominator),

  # Excused Censoring Pre-Expansion
  exc_pre_outcome = formula_components(exc_pre_covs$Outcome),
  exc_pre_numerator = formula_components(exc_pre_covs$Numerator),
  exc_pre_denominator = formula_components(exc_pre_covs$Denominator),

  # Excused Censoring Post-Expansion
  exc_post_outcome = formula_components(exc_post_covs$Outcome),
  exc_post_numerator = formula_components(exc_post_covs$Numerator),
  exc_post_denominator = formula_components(exc_post_covs$Denominator)
)

emit_reference(result)
