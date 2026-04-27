# Companion to multinomial.test.ts — multinomial excused censoring models
# Extends multinomial-source-test.R with excused censoring variants
# Usage: Rscript multinomial-excused-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "r-json-emit.R"))

# ── Multinomial Censoring Excused Pre-Expansion (treat.level = c(0,1)) ──
data <- data.table::copy(SEQdata.multitreatment)
model_exc_pre <- suppressWarnings(SEQuential(data, "ID", "time", "eligible", "tx_init", "outcome",
  list("N", "L", "P"), list("sex"),
  method = "censoring",
  options = SEQopts(multinomial = TRUE, treat.level = c(0, 1),
    weighted = TRUE, weight.preexpansion = TRUE,
    excused = TRUE, excused.cols = c("excusedZero", "excusedOne")),
  verbose = FALSE))

exc_pre_coefs <- as.vector(coef(model_exc_pre@outcome.model[[1]][[1]]))
exc_pre_names <- names(coef(model_exc_pre@outcome.model[[1]][[1]]))

# ── Multinomial Censoring Excused Post-Expansion (treat.level = c(0,1)) ──
data <- data.table::copy(SEQdata.multitreatment)
model_exc_post <- suppressWarnings(SEQuential(data, "ID", "time", "eligible", "tx_init", "outcome",
  list("N", "L", "P"), list("sex"),
  method = "censoring",
  options = SEQopts(multinomial = TRUE, treat.level = c(0, 1),
    weighted = TRUE, weight.preexpansion = FALSE,
    excused = TRUE, excused.cols = c("excusedZero", "excusedOne")),
  verbose = FALSE))

exc_post_coefs <- as.vector(coef(model_exc_post@outcome.model[[1]][[1]]))
exc_post_names <- names(coef(model_exc_post@outcome.model[[1]][[1]]))

result <- list(
  multi_exc_pre_coef_names = exc_pre_names,
  multi_exc_pre_coef_values = exc_pre_coefs,
  multi_exc_post_coef_names = exc_post_names,
  multi_exc_post_coef_values = exc_post_coefs
)

emit_reference(result)
