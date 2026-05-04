# Companion to glm-etc.test.ts — rank-deficient GLM, vcov, coef.
# Usage (from glm dir): Rscript r-source-tests/glm-etc-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "..", "source-tests", "r-json-emit.R"))

options(warn = 2)

# ── L5-21: GLM with rank-deficient design (mtcars, collinear columns) ──
data(mtcars)
mtcar2 <- within(mtcars, {
  mpg_c <- mpg * (1 + am) + 5
  am <- factor(am)
})
fm2 <- glm(disp ~ am * mpg + mpg_c, data = mtcar2)
c2 <- coef(fm2)
V2 <- vcov(fm2)
jj <- !is.na(c2)

# ── L24-70: predict.lm on rank-deficient model ──
x1 <- -4:4
x2 <- c(-2, 1, -1, 2, 0, 2, -1, 1, -2)
x3 <- 3 * x1 - 2 * x2
x4 <- x2 - x1 + 4
y <- 1 + x1 + x2 + x3 + x4 + c(-.5, .5, .5, -.5, 0, .5, -.5, -.5, .5)
mod1234 <- lm(y ~ x1 + x2 + x3 + x4)

# ── L74-98: near-singular large-value data ──
d8 <- data.frame(
  y  = c(747625803, -74936705, -750056726, -299805697,
         76131520, -225971209, 301836031, 2249594776, 300581863, -2999324198,
         450274906, -600962167, 1800954652, 900083298, -1498452810),
  X1 = c(149999999, -225000002, -149999999, 149999998, 225000002,
         -675000006, -149999998, 449999997, 900000008, -599999996,
         1350000012, 299999996, -899999988, -449999994, -299999998),
  X2 = c(300000000.5, -149999999, -300000000.5, 1, 149999999,
         -449999997, -1, 900000001.5, 599999996, -1200000002,
         899999994, 2, -6, -3, -600000001),
  X3 = c(-1, 149999998, 1, -150000002, -149999998,
         449999994, 150000002, -3, -599999992, 4,
         -899999988, -300000004, 900000012, 450000006, 2)
)
fm8 <- lm(y ~ . - 1, data = d8)

result <- list(
  # rank-deficient GLM
  rankdef_coef = as.vector(c2),
  rankdef_coef_names = names(c2),
  rankdef_na_which = which(!jj),
  rankdef_vcov_complete = as.vector(V2),
  rankdef_vcov_dim = dim(V2),
  rankdef_coef_nona = as.vector(c2[jj]),

  # rank-deficient lm: mod1234
  mod1234_coef = as.vector(coef(mod1234)),
  mod1234_coef_names = names(coef(mod1234)),
  mod1234_fitted = as.vector(fitted(mod1234)),
  mod1234_na_which = which(is.na(coef(mod1234))),

  # near-singular lm: d8
  d8_coef = as.vector(coef(fm8)),
  d8_coef_names = names(coef(fm8)),
  d8_na_which = which(is.na(coef(fm8))),
  d8_fitted = as.vector(fitted(fm8))
)
emit_reference(result)
