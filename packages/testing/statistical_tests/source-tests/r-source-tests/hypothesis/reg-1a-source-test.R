# Companion R script for reg-tests-1a.R
# Extracts portable hypothesis test cases and emits reference values as JSON.
cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "../..", "r-json-emit.R"))

# -- L1147-1154: KS test two-sample (Hollander & Wolfe example) --
# "Exact Kolmogorov-Smirnov test gave incorrect results due to rounding errors"
ks_x <- c(-0.15, 8.6, 5, 3.71, 4.29, 7.74, 2.48, 3.25, -1.15, 8.38)
ks_y <- c(2.55, 12.07, 0.46, 0.35, 2.69, -0.94, 1.73, 0.73, -0.35, -0.37)
KSxy <- ks.test(ks_x, ks_y)

emit_reference(list(
  ks_x = ks_x,
  ks_y = ks_y,
  ks_statistic = as.numeric(KSxy$statistic),
  ks_p_value = KSxy$p.value
))
