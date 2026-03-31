# Companion to hazard.test.ts — hazard ratio estimation
# Usage: Rscript hazard-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "r-json-emit.R"))

# ── ITT hazard on SEQdata ──
data <- data.table::copy(SEQdata)
model <- SEQuential(data, "ID", "time", "eligible", "tx_init", "outcome",
  list("N", "L", "P"), list("sex"),
  method = "ITT",
  options = SEQopts(hazard = TRUE, seed = 123L),
  verbose = FALSE)

hr <- hazard_ratio(model)

# ── ITT hazard with bootstrap ──
data <- data.table::copy(SEQdata)
model_boot <- SEQuential(data, "ID", "time", "eligible", "tx_init", "outcome",
  list("N", "L", "P"), list("sex"),
  method = "ITT",
  options = SEQopts(hazard = TRUE, bootstrap = TRUE, bootstrap.nboot = 3, seed = 42L),
  verbose = FALSE)

hr_boot <- hazard_ratio(model_boot)

# ── Reproducibility check (same seed) ──
data <- data.table::copy(SEQdata)
model_repro <- SEQuential(data, "ID", "time", "eligible", "tx_init", "outcome",
  list("N", "L", "P"), list("sex"),
  method = "ITT",
  options = SEQopts(hazard = TRUE, seed = 123L),
  verbose = FALSE)

hr_repro <- hazard_ratio(model_repro)

result <- list(
  hr_value = hr[["Hazard ratio"]],
  hr_repro_value = hr_repro[["Hazard ratio"]],
  hr_boot_value = hr_boot[["Hazard ratio"]],
  hr_boot_lci = hr_boot[["LCI"]],
  hr_boot_uci = hr_boot[["UCI"]]
)

emit_reference(result)
