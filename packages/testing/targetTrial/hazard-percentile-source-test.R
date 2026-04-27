# Companion to hazard.test.ts — hazard ratio with percentile bootstrap CIs
# Usage: Rscript hazard-percentile-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "r-json-emit.R"))

# ── ITT hazard with percentile bootstrap CIs ──
data <- data.table::copy(SEQdata)
model <- SEQuential(data, "ID", "time", "eligible", "tx_init", "outcome",
  list("N", "L", "P"), list("sex"),
  method = "ITT",
  options = SEQopts(hazard = TRUE, bootstrap = TRUE, bootstrap.nboot = 3,
    bootstrap.CI_method = "percentile", seed = 42L),
  verbose = FALSE)

hr <- hazard_ratio(model)

result <- list(
  hr_pct_value = hr[["Hazard ratio"]],
  hr_pct_lci = hr[["LCI"]],
  hr_pct_uci = hr[["UCI"]]
)

emit_reference(result)
