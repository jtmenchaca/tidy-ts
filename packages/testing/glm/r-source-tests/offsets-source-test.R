# Companion to offsets.test.ts — offset handling via formula vs argument.
# Usage (from glm dir): Rscript r-source-tests/offsets-source-test.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "..", "source-tests", "r-json-emit.R"))

# Load anorexia data (from MASS, bundled as .rda in R source tests)
load(file.path(.this_dir, "..", "source-tests", "tests", "anorexia.rda"))

# ── L6-9: offset via formula ──
fit1 <- lm(Postwt ~ Prewt + Treat + offset(Prewt), data = anorexia)
s1 <- summary(fit1)
pred <- fitted(fit1)

# ── L12-14: offset via argument ──
fit2 <- lm(Postwt ~ Prewt + Treat, data = anorexia, offset = Prewt)
s2 <- summary(fit2)

# ── L17-21: two offsets summing to same total ──
anorexia$o1 <- 0.9 * anorexia$Prewt
anorexia$o2 <- 0.1 * anorexia$Prewt
fit3 <- lm(Postwt ~ Prewt + Treat + offset(o1) + offset(o2), data = anorexia)
s3 <- summary(fit3)

# ── L23-25: mixed formula + argument offsets ──
fit4 <- lm(Postwt ~ Prewt + Treat + offset(o1), data = anorexia, offset = o2)
s4 <- summary(fit4)

result <- list(
  # Data for TS reproduction
  Postwt = anorexia$Postwt,
  Prewt = anorexia$Prewt,
  Treat = as.character(anorexia$Treat),

  # fit1: offset via formula
  fit1_coef = as.vector(coef(fit1)),
  fit1_coef_names = names(coef(fit1)),
  fit1_fitted = as.vector(pred),
  fit1_sigma = sigma(fit1),
  fit1_r_squared = s1$r.squared,

  # fit2: offset via argument — should match fit1
  fit2_coef = as.vector(coef(fit2)),
  fit2_fitted = as.vector(fitted(fit2)),
  fit2_sigma = sigma(fit2),

  # fit3: two formula offsets — should match fit1
  fit3_coef = as.vector(coef(fit3)),
  fit3_fitted = as.vector(fitted(fit3)),
  fit3_sigma = sigma(fit3),

  # fit4: mixed formula + argument offsets — should match fit1
  fit4_coef = as.vector(coef(fit4)),
  fit4_fitted = as.vector(fitted(fit4)),
  fit4_sigma = sigma(fit4)
)
emit_reference(result)
