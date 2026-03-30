# Companion to brier.test.ts — Brier scores (Tier 4)
# Usage (from this directory): Rscript brier-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "source-tests", "r-json-emit.R"))

# Brier score computation requires rotterdam data, pspline, rttright,
# and complex multi-subject survfit prediction — all Tier 4 functionality.
# The R source brier.R depends on:
#   - pspline() terms in coxph
#   - rttright() for reverse-time-to-event censoring weights
#   - survfit with individual=TRUE for subject-level predictions
result <- list(
  note = "brier.R tests Brier scores using rotterdam data, pspline terms, rttright censoring weights, and multi-subject survfit prediction. All are Tier 4 functionality: pspline is a penalized spline requiring specialized fitting, rttright requires reverse KM weighting, and subject-level survfit prediction needs the newdata/individual interface."
)
emit_reference(result)
