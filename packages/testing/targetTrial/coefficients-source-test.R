# Companion to coefficients.test.ts — outcome model coefficients across methods
# Usage: Rscript coefficients-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "r-json-emit.R"))

# ── ITT on SEQdata ──
data <- data.table::copy(SEQdata)
model_itt <- SEQuential(data, "ID", "time", "eligible", "tx_init", "outcome",
  list("N", "L", "P"), list("sex"),
  method = "ITT", options = SEQopts(), verbose = FALSE)

itt_coefs <- as.vector(coef(model_itt@outcome.model[[1]][[1]]))
itt_names <- names(coef(model_itt@outcome.model[[1]][[1]]))
itt_covs <- covariates(model_itt)

# ── Pre-Expansion Dose-Response on SEQdata ──
data <- data.table::copy(SEQdata)
model_dr_pre <- suppressWarnings(SEQuential(data, "ID", "time", "eligible", "tx_init", "outcome",
  list("N", "L", "P"), list("sex"),
  method = "dose-response",
  options = SEQopts(weighted = TRUE), verbose = FALSE))

dr_pre_coefs <- as.vector(coef(model_dr_pre@outcome.model[[1]][[1]]))
dr_pre_names <- names(coef(model_dr_pre@outcome.model[[1]][[1]]))

# ── Post-Expansion Dose-Response on SEQdata ──
data <- data.table::copy(SEQdata)
model_dr_post <- suppressWarnings(SEQuential(data, "ID", "time", "eligible", "tx_init", "outcome",
  list("N", "L", "P"), list("sex"),
  method = "dose-response",
  options = SEQopts(weighted = TRUE, weight.preexpansion = FALSE), verbose = FALSE))

dr_post_coefs <- as.vector(coef(model_dr_post@outcome.model[[1]][[1]]))
dr_post_names <- names(coef(model_dr_post@outcome.model[[1]][[1]]))

# ── Pre-Expansion Censoring on SEQdata ──
data <- data.table::copy(SEQdata)
model_cens_pre <- suppressWarnings(SEQuential(data, "ID", "time", "eligible", "tx_init", "outcome",
  list("N", "L", "P"), list("sex"),
  method = "censoring",
  options = SEQopts(weighted = TRUE), verbose = FALSE))

cens_pre_coefs <- as.vector(coef(model_cens_pre@outcome.model[[1]][[1]]))
cens_pre_names <- names(coef(model_cens_pre@outcome.model[[1]][[1]]))

# ── Post-Expansion Censoring on SEQdata ──
data <- data.table::copy(SEQdata)
model_cens_post <- suppressWarnings(SEQuential(data, "ID", "time", "eligible", "tx_init", "outcome",
  list("N", "L", "P"), list("sex"),
  method = "censoring",
  options = SEQopts(weighted = TRUE, weight.preexpansion = FALSE), verbose = FALSE))

cens_post_coefs <- as.vector(coef(model_cens_post@outcome.model[[1]][[1]]))
cens_post_names <- names(coef(model_cens_post@outcome.model[[1]][[1]]))

# ── Pre-Expansion Excused Censoring on SEQdata ──
data <- data.table::copy(SEQdata)
model_exc_pre <- suppressWarnings(SEQuential(data, "ID", "time", "eligible", "tx_init", "outcome",
  list("N", "L", "P"), list("sex"),
  method = "censoring",
  options = SEQopts(weighted = TRUE, excused = TRUE,
    excused.cols = c("excusedZero", "excusedOne")), verbose = FALSE))

exc_pre_coefs <- as.vector(coef(model_exc_pre@outcome.model[[1]][[1]]))
exc_pre_names <- names(coef(model_exc_pre@outcome.model[[1]][[1]]))

# ── Post-Expansion Excused Censoring on SEQdata ──
data <- data.table::copy(SEQdata)
model_exc_post <- suppressWarnings(SEQuential(data, "ID", "time", "eligible", "tx_init", "outcome",
  list("N", "L", "P"), list("sex"),
  method = "censoring",
  options = SEQopts(weighted = TRUE, excused = TRUE,
    excused.cols = c("excusedZero", "excusedOne"),
    weight.preexpansion = FALSE, weight.upper = 1), verbose = FALSE))

exc_post_coefs <- as.vector(coef(model_exc_post@outcome.model[[1]][[1]]))
exc_post_names <- names(coef(model_exc_post@outcome.model[[1]][[1]]))

# ── Pre-Expansion ITT with LTFU on SEQdata.LTFU ──
data <- data.table::copy(SEQdata.LTFU)
model_ltfu_pre <- SEQuential(data, "ID", "time", "eligible", "tx_init", "outcome",
  list("N", "L", "P"), list("sex"),
  method = "ITT",
  options = SEQopts(cense = "LTFU", weight.preexpansion = TRUE, fastglm.method = 1),
  verbose = FALSE)

ltfu_pre_coefs <- as.vector(coef(model_ltfu_pre@outcome.model[[1]][[1]]))
ltfu_pre_names <- names(coef(model_ltfu_pre@outcome.model[[1]][[1]]))

# ── Post-Expansion ITT with LTFU on SEQdata.LTFU ──
data <- data.table::copy(SEQdata.LTFU)
model_ltfu_post <- SEQuential(data, "ID", "time", "eligible", "tx_init", "outcome",
  list("N", "L", "P"), list("sex"),
  method = "ITT",
  options = SEQopts(cense = "LTFU", weight.preexpansion = FALSE, fastglm.method = 1),
  verbose = FALSE)

ltfu_post_coefs <- as.vector(coef(model_ltfu_post@outcome.model[[1]][[1]]))
ltfu_post_names <- names(coef(model_ltfu_post@outcome.model[[1]][[1]]))

# ── ITT Multinomial on SEQdata.multitreatment (treat.level = c(1,2)) ──
data <- data.table::copy(SEQdata.multitreatment)
model_multi <- SEQuential(data, "ID", "time", "eligible", "tx_init", "outcome",
  list("N", "L", "P"), list("sex"),
  method = "ITT",
  options = SEQopts(multinomial = TRUE, treat.level = c(1, 2)),
  verbose = FALSE)

multi_coefs <- as.vector(coef(model_multi@outcome.model[[1]][[1]]))
multi_names <- names(coef(model_multi@outcome.model[[1]][[1]]))

result <- list(
  # ITT
  itt_coef_names = itt_names,
  itt_coef_values = itt_coefs,
  itt_outcome_formula = itt_covs$Outcome,
  itt_numerator_formula = itt_covs$Numerator,
  itt_denominator_formula = itt_covs$Denominator,

  # Dose-Response Pre-Expansion
  dr_pre_coef_names = dr_pre_names,
  dr_pre_coef_values = dr_pre_coefs,

  # Dose-Response Post-Expansion
  dr_post_coef_names = dr_post_names,
  dr_post_coef_values = dr_post_coefs,

  # Censoring Pre-Expansion
  cens_pre_coef_names = cens_pre_names,
  cens_pre_coef_values = cens_pre_coefs,

  # Censoring Post-Expansion
  cens_post_coef_names = cens_post_names,
  cens_post_coef_values = cens_post_coefs,

  # Excused Censoring Pre-Expansion
  exc_pre_coef_names = exc_pre_names,
  exc_pre_coef_values = exc_pre_coefs,

  # Excused Censoring Post-Expansion
  exc_post_coef_names = exc_post_names,
  exc_post_coef_values = exc_post_coefs,

  # LTFU Pre-Expansion
  ltfu_pre_coef_names = ltfu_pre_names,
  ltfu_pre_coef_values = ltfu_pre_coefs,

  # LTFU Post-Expansion
  ltfu_post_coef_names = ltfu_post_names,
  ltfu_post_coef_values = ltfu_post_coefs,

  # Multinomial
  multi_coef_names = multi_names,
  multi_coef_values = multi_coefs
)

emit_reference(result)
