# Companion to survival.test.ts — survival curves, risk data, risk comparisons
# Usage: Rscript survival-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "r-json-emit.R"))

# ── ITT with km_curves on SEQdata ──
data <- data.table::copy(SEQdata)
invisible(capture.output(
  model <- SEQuential(data, "ID", "time", "eligible", "tx_init", "outcome",
    list("N", "L", "P"), list("sex"),
    method = "ITT",
    options = SEQopts(km.curves = TRUE),
    verbose = FALSE)
))

surv <- km_data(model)
risk <- risk_data(model)
risk_comp <- risk_comparison(model)

# Extract survival curves per arm (variable column has "surv_0", "surv_1")
surv_0 <- surv[surv$variable == "surv_0", ]
surv_1 <- surv[surv$variable == "surv_1", ]

result <- list(
  surv_followup_0 = surv_0$followup,
  surv_value_0 = surv_0$value,
  surv_followup_1 = surv_1$followup,
  surv_value_1 = surv_1$value,

  risk_arms = risk$A,
  risk_values = risk$Risk,

  risk_comp_ax = as.character(risk_comp$A_x),
  risk_comp_ay = as.character(risk_comp$A_y),
  risk_ratio = risk_comp[["Risk Ratio"]],
  risk_difference = risk_comp[["Risk Difference"]]
)

emit_reference(result)
