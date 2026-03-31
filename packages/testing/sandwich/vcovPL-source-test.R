# Companion to vcovPL.test.ts — panel lag covariance matrices
# Usage (from this directory): Rscript vcovPL-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "source-tests", "r-json-emit.R"))

data("PetersenCL", package = "sandwich")
m <- lm(y ~ x, data = PetersenCL)

pl_2way_adj <- vcovPL(m, cluster = ~ firm + year, adjust = TRUE)
pl_2way_noadj <- vcovPL(m, cluster = ~ firm + year, adjust = FALSE)
pl_1way_noadj <- vcovPL(m, cluster = ~ firm, adjust = FALSE)

# InstInnovation with Poisson GLM
data("InstInnovation", package = "sandwich")
n <- glm(cites ~ institutions, family = poisson, data = InstInnovation)
pl_poisson_adj <- vcovPL(n, cluster = ~ industry, adjust = TRUE)
pl_poisson_noadj <- vcovPL(n, cluster = ~ industry, adjust = FALSE)

# Stata reference: xtscc y x, lag(1) ase
stata_se <- c(0.0243573, 0.0281633)

result <- list(
  lm_coef = as.vector(coef(m)),
  poisson_coef = as.vector(coef(n)),
  pl_2way_adj = as.vector(pl_2way_adj),
  pl_2way_noadj = as.vector(pl_2way_noadj),
  pl_1way_noadj = as.vector(pl_1way_noadj),
  pl_poisson_adj = as.vector(pl_poisson_adj),
  pl_poisson_noadj = as.vector(pl_poisson_noadj),
  stata_se = stata_se
)
emit_reference(result)
