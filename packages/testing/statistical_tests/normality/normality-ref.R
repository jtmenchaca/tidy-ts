cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "..", "r-json-emit.R"))

library(nortest)
library(fBasics)

normal_data <- c(0.12, -0.45, 0.78, -0.23, 1.34, -0.67, 0.56, -0.12, 0.89, -0.34, 0.45, -0.78, 1.12, -0.56, 0.23, 0.67, -0.89, 0.34, -0.11, 0.90)
skewed_data <- c(0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 7.0, 10.0, 12.0, 15.0, 20.0, 30.0)
uniform_data <- c(0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.45, 0.50, 0.55, 0.60, 0.65, 0.70, 0.75, 0.80, 0.85, 0.90, 0.95, 1.00)

# Shapiro-Wilk tests
sw_normal <- shapiro.test(normal_data)
sw_skewed <- shapiro.test(skewed_data)
sw_uniform <- shapiro.test(uniform_data)

# Anderson-Darling tests
ad_normal <- nortest::ad.test(normal_data)
ad_skewed <- nortest::ad.test(skewed_data)

# D'Agostino-Pearson tests
dag_normal <- fBasics::dagoTest(normal_data)
dag_skewed <- fBasics::dagoTest(skewed_data)

emit_reference(list(
  shapiro_normal_W = sw_normal$statistic[[1]],
  shapiro_normal_p = sw_normal$p.value,
  shapiro_skewed_W = sw_skewed$statistic[[1]],
  shapiro_skewed_p = sw_skewed$p.value,
  shapiro_uniform_W = sw_uniform$statistic[[1]],
  shapiro_uniform_p = sw_uniform$p.value,
  ad_normal_A = ad_normal$statistic[[1]],
  ad_normal_p = ad_normal$p.value,
  ad_skewed_A = ad_skewed$statistic[[1]],
  ad_skewed_p = ad_skewed$p.value,
  dagostino_normal_stat = dag_normal@test$statistic[[1]],
  dagostino_normal_p = dag_normal@test$p.value[[1]],
  dagostino_skewed_stat = dag_skewed@test$statistic[[1]],
  dagostino_skewed_p = dag_skewed@test$p.value[[1]],

  dagostino_uniform_stat = fBasics::dagoTest(uniform_data)@test$statistic[[1]],
  dagostino_uniform_p = fBasics::dagoTest(uniform_data)@test$p.value[[1]]
))
