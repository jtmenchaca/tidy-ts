# Companion to residms.test.ts — multi-state Cox model residuals (Tier 4)
# Usage (from this directory): Rscript residms-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "source-tests", "r-json-emit.R"))

# Multi-state Cox residuals require coxphms (multi-state coxph) which is Tier 4.
# The R source residms.R tests residuals.coxphms — a specialized residual method
# for multi-state Cox models with transition-specific hazards.
result <- list(
  note = "residms.R tests residuals for multi-state Cox models (coxphms). This requires multi-state survival support: competing risks, transition-specific hazards, and the coxphms model class. All are Tier 4 functionality."
)
emit_reference(result)
