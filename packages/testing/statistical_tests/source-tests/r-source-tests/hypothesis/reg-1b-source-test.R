# Companion R script for reg-tests-1b.R
# Extracts portable hypothesis test cases and emits reference values as JSON.
cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "../..", "r-json-emit.R"))

# -- L364: shapiro.test(c(0,0,1))$p.value >= 0 --
shap <- shapiro.test(c(0, 0, 1))

# -- L810-813: cor.test Spearman symmetry (PR#13574) --
x <- 1:11
y <- c(6:1, 7, 11:8)
sp_greater <- cor.test(x, y, method = "spearman", alternative = "greater")
sp_less <- cor.test(x, -y, method = "spearman", alternative = "less")

# -- L1074-1076: ks.test p=20/21 (floating point edge case) --
ks5 <- ks.test(1:5, c(2.5, 4.5))

emit_reference(list(
  # shapiro
  shapiro_statistic = as.numeric(shap$statistic),
  shapiro_p_value = shap$p.value,

  # cor.test spearman symmetry
  spearman_x = as.vector(x),
  spearman_y = as.vector(y),
  spearman_greater_p = sp_greater$p.value,
  spearman_greater_rho = as.numeric(sp_greater$estimate),
  spearman_less_p = sp_less$p.value,
  spearman_less_rho = as.numeric(sp_less$estimate),

  # ks.test
  ks5_statistic = as.numeric(ks5$statistic),
  ks5_p_value = ks5$p.value
))
