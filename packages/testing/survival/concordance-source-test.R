# Companion to concordance.test.ts — concordance statistic validation
# Usage (from this directory): Rscript concordance-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "source-tests", "r-json-emit.R"))

# ── AML maintained subset ────────────────────────────────────────────────
tdata <- aml[aml$x == 'Maintained', c("time", "status")]
tdata$x <- c(1, 6, 2, 7, 3, 7, 3, 8, 4, 4, 5)
fit <- concordance(Surv(time, status) ~ x, tdata)
# count should be c(24, 14, 2, 0)

# ── Lung data: age ───────────────────────────────────────────────────────
fit3 <- concordance(Surv(time, status) ~ age, lung, reverse = TRUE)

# ── Lung data: ph.ecog ───────────────────────────────────────────────────
fit4 <- concordance(Surv(time, status) ~ ph.ecog, lung, reverse = TRUE)
# count should be c(8392, 4258, 7137, 21, 7)

result <- list(
  aml_count       = fit$count[1:4],
  aml_concordance = fit$concordance,
  lung_age_count  = fit3$count[1:5],
  lung_age_conc   = fit3$concordance,
  lung_ecog_count = fit4$count[1:5],
  lung_ecog_conc  = fit4$concordance
)
emit_reference(result)
