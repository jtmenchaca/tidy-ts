#!/usr/bin/env Rscript

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "..", "r-json-emit.R"))

# --- Scenario 1: one_sample_two_sided ---
res <- prop.test(x = 45, n = 100, p = 0.5)
one_sample_two_sided <- list(
  one_sample_two_sided_statistic = unname(res$statistic),
  one_sample_two_sided_p_value = res$p.value,
  one_sample_two_sided_conf_int_lower = res$conf.int[1],
  one_sample_two_sided_conf_int_upper = res$conf.int[2],
  one_sample_two_sided_estimate = unname(res$estimate)
)

# --- Scenario 2: one_sample_less ---
res <- prop.test(x = 45, n = 100, p = 0.5, alternative = "less")
one_sample_less <- list(
  one_sample_less_statistic = unname(res$statistic),
  one_sample_less_p_value = res$p.value,
  one_sample_less_conf_int_lower = res$conf.int[1],
  one_sample_less_conf_int_upper = res$conf.int[2],
  one_sample_less_estimate = unname(res$estimate)
)

# --- Scenario 3: one_sample_greater ---
res <- prop.test(x = 60, n = 100, p = 0.5, alternative = "greater")
one_sample_greater <- list(
  one_sample_greater_statistic = unname(res$statistic),
  one_sample_greater_p_value = res$p.value,
  one_sample_greater_conf_int_lower = res$conf.int[1],
  one_sample_greater_conf_int_upper = res$conf.int[2],
  one_sample_greater_estimate = unname(res$estimate)
)

# --- Scenario 4: one_sample_custom_p ---
res <- prop.test(x = 30, n = 100, p = 0.4)
one_sample_custom_p <- list(
  one_sample_custom_p_statistic = unname(res$statistic),
  one_sample_custom_p_p_value = res$p.value,
  one_sample_custom_p_conf_int_lower = res$conf.int[1],
  one_sample_custom_p_conf_int_upper = res$conf.int[2],
  one_sample_custom_p_estimate = unname(res$estimate)
)

# --- Scenario 5: two_sample_two_sided ---
res <- prop.test(c(45, 55), c(100, 100))
two_sample_two_sided <- list(
  two_sample_two_sided_statistic = unname(res$statistic),
  two_sample_two_sided_p_value = res$p.value,
  two_sample_two_sided_conf_int_lower = res$conf.int[1],
  two_sample_two_sided_conf_int_upper = res$conf.int[2],
  two_sample_two_sided_estimate_1 = unname(res$estimate[1]),
  two_sample_two_sided_estimate_2 = unname(res$estimate[2])
)

# --- Scenario 6: two_sample_greater ---
res <- prop.test(c(60, 40), c(100, 100), alternative = "greater")
two_sample_greater <- list(
  two_sample_greater_statistic = unname(res$statistic),
  two_sample_greater_p_value = res$p.value,
  two_sample_greater_conf_int_lower = res$conf.int[1],
  two_sample_greater_conf_int_upper = res$conf.int[2],
  two_sample_greater_estimate_1 = unname(res$estimate[1]),
  two_sample_greater_estimate_2 = unname(res$estimate[2])
)

# --- Scenario 7: two_sample_equal ---
res <- prop.test(c(50, 50), c(100, 100))
two_sample_equal <- list(
  two_sample_equal_statistic = unname(res$statistic),
  two_sample_equal_p_value = res$p.value,
  two_sample_equal_conf_int_lower = res$conf.int[1],
  two_sample_equal_conf_int_upper = res$conf.int[2],
  two_sample_equal_estimate_1 = unname(res$estimate[1]),
  two_sample_equal_estimate_2 = unname(res$estimate[2])
)

# --- Scenario 8: two_sample_less ---
res <- prop.test(c(40, 60), c(100, 100), alternative = "less")
two_sample_less <- list(
  two_sample_less_statistic = unname(res$statistic),
  two_sample_less_p_value = res$p.value,
  two_sample_less_conf_int_lower = res$conf.int[1],
  two_sample_less_conf_int_upper = res$conf.int[2],
  two_sample_less_estimate_1 = unname(res$estimate[1]),
  two_sample_less_estimate_2 = unname(res$estimate[2])
)

# Combine all and emit
result <- c(
  one_sample_two_sided,
  one_sample_less,
  one_sample_greater,
  one_sample_custom_p,
  two_sample_two_sided,
  two_sample_greater,
  two_sample_equal,
  two_sample_less
)

emit_reference(result)
