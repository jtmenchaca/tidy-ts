# Companion to vcovPC.test.ts — panel-corrected covariance matrices
# Usage (from this directory): Rscript vcovPC-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "source-tests", "r-json-emit.R"))

data("PetersenCL", package = "sandwich")
m <- lm(y ~ x, data = PetersenCL)

pc_full <- sandwich::vcovPC(m, cluster = ~ firm + year)

# Unbalanced panel
PU <- subset(PetersenCL, !(firm == 1 & year == 10))
u_m <- lm(y ~ x, data = PU)
pc_unbal_pw <- sandwich::vcovPC(u_m, cluster = ~ firm + year, pairwise = TRUE)
pc_unbal_nopw <- sandwich::vcovPC(u_m, cluster = ~ firm + year, pairwise = FALSE)

# Stata reference: xtscc y x
stata_se <- c(0.0222006, 0.025276)

result <- list(
  coef = as.vector(coef(m)),
  pc_full = as.vector(pc_full),
  pc_unbal_pw = as.vector(pc_unbal_pw),
  pc_unbal_nopw = as.vector(pc_unbal_nopw),
  stata_se = stata_se,
  n_obs = nrow(PetersenCL),
  n_firms = length(unique(PetersenCL$firm)),
  n_years = length(unique(PetersenCL$year))
)
emit_reference(result)
