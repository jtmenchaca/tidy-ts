# SEQTaRget ITT integration test — R reference values
# Runs SEQTaRget on SEQdata with ITT method, outputs JSON to stdout
# Usage: Rscript itt-source-test.R

suppressPackageStartupMessages({
  library(SEQTaRget)
  library(jsonlite)
})

data <- SEQdata

# ── Test 1: ITT, no bootstrap, km_curves = TRUE ──
model <- SEQuential(data,
  id.col = "ID",
  time.col = "time",
  eligible.col = "eligible",
  treatment.col = "tx_init",
  outcome.col = "outcome",
  time_varying.cols = c("N", "L", "P"),
  fixed.cols = "sex",
  method = "ITT",
  options = SEQopts(km.curves = TRUE),
  verbose = FALSE
)

# Extract survival data
surv <- km_data(model)
risk <- risk_data(model)
risk_comp <- risk_comparison(model)

# Extract outcome model coefficients (full data, first pass)
outcome_models <- outcome(model)
outcome_coefs <- coef(outcome_models[[1]][[1]])

# Extract formulas
covs <- covariates(model)

ref <- list(
  # Survival curves per arm
  survival_followup_0 = surv[surv$arm == 0, "followup_time"],
  survival_value_0 = surv[surv$arm == 0, "survival"],
  survival_followup_1 = surv[surv$arm == 1, "followup_time"],
  survival_value_1 = surv[surv$arm == 1, "survival"],

  # Risk data at end of follow-up
  risk_arms = as.character(risk$arm),
  risk_values = risk$risk,

  # Risk comparison
  risk_ratio = risk_comp$risk_ratio,
  risk_difference = risk_comp$risk_difference,

  # Outcome model coefficients
  outcome_coef_names = names(outcome_coefs),
  outcome_coef_values = unname(outcome_coefs),

  # Formulas used
  outcome_formula = covs$Outcome,
  numerator_formula = covs$Numerator,
  denominator_formula = covs$Denominator
)

cat(toJSON(ref, auto_unbox = TRUE, digits = 10))
