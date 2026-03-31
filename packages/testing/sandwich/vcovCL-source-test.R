# Companion to vcovCL.test.ts — clustered covariance matrices
# Usage (from this directory): Rscript vcovCL-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "source-tests", "r-json-emit.R"))

data("PetersenCL", package = "sandwich")
m <- lm(y ~ x, data = PetersenCL)
b <- glm((y > 0) ~ x, data = PetersenCL, family = binomial(link = "logit"))

# --- single-cluster LM tests ---
lm_hc0_ca   <- vcovCL(m, cluster = ~ firm, type = "HC0", cadjust = TRUE)
lm_hc0_noca <- vcovCL(m, cluster = ~ firm, type = "HC0", cadjust = FALSE)
lm_hc1_ca   <- vcovCL(m, cluster = ~ firm, type = "HC1", cadjust = TRUE)
lm_hc1_noca <- vcovCL(m, cluster = ~ firm, type = "HC1", cadjust = FALSE)

# --- single-cluster GLM (logit) tests ---
glm_hc0_ca   <- vcovCL(b, cluster = ~ firm, type = "HC0", cadjust = TRUE)
glm_hc0_noca <- vcovCL(b, cluster = ~ firm, type = "HC0", cadjust = FALSE)
glm_hc1_ca   <- vcovCL(b, cluster = ~ firm, type = "HC1", cadjust = TRUE)
glm_hc1_noca <- vcovCL(b, cluster = ~ firm, type = "HC1", cadjust = FALSE)

# --- single-cluster Gaussian GLM (equivalent to LM) ---
# Our vcovCL works on glmFit, so we test via glm(gaussian) which should
# match R's lm() sandwich results exactly
g <- glm(y ~ x, data = PetersenCL, family = gaussian(link = "identity"))
gauss_hc0_ca   <- vcovCL(g, cluster = ~ firm, type = "HC0", cadjust = TRUE)
gauss_hc0_noca <- vcovCL(g, cluster = ~ firm, type = "HC0", cadjust = FALSE)
gauss_hc1_ca   <- vcovCL(g, cluster = ~ firm, type = "HC1", cadjust = TRUE)
gauss_hc1_noca <- vcovCL(g, cluster = ~ firm, type = "HC1", cadjust = FALSE)

# --- Stata reference values ---
# regress y x, vce(cluster firm)
stata_lm <- matrix(c(0.0044907, -0.00006474, -0.00006474, 0.00255993), nrow = 2)
# brl binary x, cluster(firm) logit
stata_glm <- matrix(c(0.00358954, 0.00001531, 0.00001531, 0.00275766), nrow = 2)

result <- list(
  lm_coef = as.vector(coef(m)),
  glm_coef = as.vector(coef(b)),
  gauss_coef = as.vector(coef(g)),
  lm_hc0_ca = as.vector(lm_hc0_ca),
  lm_hc0_noca = as.vector(lm_hc0_noca),
  lm_hc1_ca = as.vector(lm_hc1_ca),
  lm_hc1_noca = as.vector(lm_hc1_noca),
  glm_hc0_ca = as.vector(glm_hc0_ca),
  glm_hc0_noca = as.vector(glm_hc0_noca),
  glm_hc1_ca = as.vector(glm_hc1_ca),
  glm_hc1_noca = as.vector(glm_hc1_noca),
  gauss_hc0_ca = as.vector(gauss_hc0_ca),
  gauss_hc0_noca = as.vector(gauss_hc0_noca),
  gauss_hc1_ca = as.vector(gauss_hc1_ca),
  gauss_hc1_noca = as.vector(gauss_hc1_noca),
  stata_lm = as.vector(stata_lm),
  stata_glm = as.vector(stata_glm),
  n_firms = length(unique(PetersenCL$firm)),
  n_obs = nrow(PetersenCL)
)
emit_reference(result)
