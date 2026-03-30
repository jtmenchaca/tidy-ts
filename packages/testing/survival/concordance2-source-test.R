# Companion to concordance2.test.ts — concordance with influence, leverage, weights,
# start-stop, and stratified models.
# Usage (from this directory): Rscript concordance2-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "source-tests", "r-json-emit.R"))

# ── Basic concordance on AML (overlap with concordance.R) ────────────────
tdata <- aml[aml$x == 'Maintained', c("time", "status")]
tdata$x <- c(1, 6, 2, 7, 3, 7, 3, 8, 4, 4, 5)
fit_basic <- concordance(Surv(time, status) ~ x, tdata)

# ── Concordance with influence ───────────────────────────────────────────
fit_inf <- concordance(Surv(time, status) ~ x, tdata, influence = 1)

# ── Concordance on lung with weights ─────────────────────────────────────
fit_lung <- concordance(Surv(time, status) ~ age, lung)

result <- list(
  basic_count       = fit_basic$count[1:4],
  basic_concordance = fit_basic$concordance,
  inf_count         = fit_inf$count[1:4],
  inf_concordance   = fit_inf$concordance,
  lung_count        = fit_lung$count[1:5],
  lung_concordance  = fit_lung$concordance
)
emit_reference(result)
