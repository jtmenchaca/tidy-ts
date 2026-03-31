# Companion to survival.test.ts — survival curves, risk data, risk comparisons
# Usage: Rscript survival-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "r-json-emit.R"))

# ── ITT with km_curves on SEQdata ──
data <- data.table::copy(SEQdata)
model <- SEQuential(data, "ID", "time", "eligible", "tx_init", "outcome",
  list("N", "L", "P"), list("sex"),
  method = "ITT",
  options = SEQopts(km.curves = TRUE),
  verbose = FALSE)

surv <- km_data(model)
risk <- risk_data(model)
risk_comp <- risk_comparison(model)

# Extract survival curves per arm
arms <- sort(unique(surv$arm))

result <- list()
for (arm in arms) {
  arm_data <- surv[surv$arm == arm, ]
  result[[paste0("surv_followup_", arm)]] <- arm_data$followup_time
  result[[paste0("surv_value_", arm)]] <- arm_data$survival
}

result$risk_arms <- as.character(risk$arm)
result$risk_values <- risk$risk
result$risk_ratio <- risk_comp$risk_ratio
result$risk_difference <- risk_comp$risk_difference

emit_reference(result)
