# Companion to concordance3.test.ts — concordance model comparison, time weights,
# and start-stop data.
# Usage (from this directory): Rscript concordance3-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "source-tests", "r-json-emit.R"))

# ── Basic concordance for model comparison baseline ──────────────────────
fit_age  <- concordance(Surv(time, status) ~ age, lung)
fit_sex  <- concordance(Surv(time, status) ~ sex, lung)

# ── Time-weighted concordance (timewt) ───────────────────────────────────
# concordance3.R tests different time weight functions:
# timewt = "n" (default), "n/G", "n/G2", "S", "S/G", "I"
fit_default <- concordance(Surv(time, status) ~ age, lung, timewt = "n")
fit_SG      <- concordance(Surv(time, status) ~ age, lung, timewt = "S/G")

# ── Start-stop concordance ───────────────────────────────────────────────
# bladder2 has start-stop format
fit_bladder <- concordance(Surv(start, stop, event) ~ number, bladder2)

result <- list(
  age_concordance     = fit_age$concordance,
  age_count           = fit_age$count[1:5],
  sex_concordance     = fit_sex$concordance,
  sex_count           = fit_sex$count[1:5],
  default_concordance = fit_default$concordance,
  SG_concordance      = fit_SG$concordance,
  bladder_concordance = fit_bladder$concordance,
  bladder_count       = fit_bladder$count[1:5]
)
emit_reference(result)
