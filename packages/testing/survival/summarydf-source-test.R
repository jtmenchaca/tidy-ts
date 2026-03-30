# Companion to summarydf.test.ts — data.frame option of summary.survfit
# Usage (from this directory): Rscript summarydf-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "source-tests", "r-json-emit.R"))

options(na.action = na.exclude)

surv1 <- survfit(Surv(time, status) ~ ph.ecog, lung)
summ1 <- summary(surv1, times=round(30.5*1:32))

result <- list(
  n_times = length(summ1$time),
  first_time = summ1$time[1],
  n_strata = length(unique(summ1$strata))
)
emit_reference(result)
