# Companion to coxsurv6.test.ts — multi-state with shared hazards (Tier 4).
# Usage (from this directory): Rscript coxsurv6-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "source-tests", "r-json-emit.R"))

result <- list(note = "Multi-state with shared hazards requires Tier 4 implementation")
emit_reference(result)
