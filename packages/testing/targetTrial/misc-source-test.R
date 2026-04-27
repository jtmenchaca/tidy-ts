# Companion to misc.test.ts — miscellaneous configuration variants
# Usage: Rscript misc-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "r-json-emit.R"))

# ── Unweighted Censoring ──
data <- data.table::copy(SEQdata)
model_cens_unwt <- SEQuential(data, "ID", "time", "eligible", "tx_init", "outcome",
  list("N", "L", "P"), list("sex"),
  method = "censoring",
  options = SEQopts(weighted = FALSE), verbose = FALSE)
cens_unwt_coefs <- as.vector(coef(model_cens_unwt@outcome.model[[1]][[1]]))
cens_unwt_names <- names(coef(model_cens_unwt@outcome.model[[1]][[1]]))

# ── ITT - Followup Spline ──
data <- data.table::copy(SEQdata)
model_spline <- SEQuential(data, "ID", "time", "eligible", "tx_init", "outcome",
  list("N", "L", "P"), list("sex"),
  method = "ITT",
  options = SEQopts(followup.spline = TRUE, followup.include = FALSE), verbose = FALSE)
spline_coefs <- as.vector(coef(model_spline@outcome.model[[1]][[1]]))
spline_names <- names(coef(model_spline@outcome.model[[1]][[1]]))

# ── ITT - followup.include = FALSE ──
data <- data.table::copy(SEQdata)
model_no_fup <- SEQuential(data, "ID", "time", "eligible", "tx_init", "outcome",
  list("N", "L", "P"), list("sex"),
  method = "ITT",
  options = SEQopts(followup.include = FALSE), verbose = FALSE)
no_fup_coefs <- as.vector(coef(model_no_fup@outcome.model[[1]][[1]]))
no_fup_names <- names(coef(model_no_fup@outcome.model[[1]][[1]]))

# ── ITT with visit variable ──
data <- data.table::copy(SEQdata.LTFU)
model_visit <- SEQuential(data, "ID", "time", "eligible", "tx_init", "outcome",
  list("N", "L", "P"), list("sex"),
  method = "ITT",
  options = SEQopts(visit = "LTFU", weight.preexpansion = TRUE,
    fastglm.method = 1, weighted = TRUE), verbose = FALSE)
visit_coefs <- as.vector(coef(model_visit@outcome.model[[1]][[1]]))
visit_names <- names(coef(model_visit@outcome.model[[1]][[1]]))

# ── Expanded data max trial check ──
model_dr <- suppressWarnings(SEQuential(data.table::copy(SEQdata),
  "ID", "time", "eligible", "tx_init", "outcome",
  list("N", "L", "P"), list("sex"), method = "ITT",
  options = SEQopts(data.return = TRUE), verbose = FALSE))
last_elig_idx <- SEQdata[, .(last_elig = max(which(eligible == 1L)) - 1L), by = ID]
max_trial_expanded <- max(model_dr@DT$trial)
max_last_elig <- max(last_elig_idx$last_elig)

result <- list(
  cens_unwt_coef_names = cens_unwt_names,
  cens_unwt_coef_values = cens_unwt_coefs,

  spline_coef_names = spline_names,
  spline_coef_values = spline_coefs,

  no_fup_coef_names = no_fup_names,
  no_fup_coef_values = no_fup_coefs,

  visit_coef_names = visit_names,
  visit_coef_values = visit_coefs,

  max_trial_expanded = max_trial_expanded,
  max_last_elig = max_last_elig
)

emit_reference(result)
