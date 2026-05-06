#!/usr/bin/env Rscript

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "..", "r-json-emit.R"))

# --- Scenario 1: one_sample ---
data1 <- c(2.3, 1.9, 2.5, 2.1, 2.8, 2.0, 2.4)
res <- t.test(data1, mu = 2.0, alternative = "two.sided")
one_sample <- list(
  one_sample_statistic = unname(res$statistic),
  one_sample_p_value = res$p.value,
  one_sample_conf_int_lower = res$conf.int[1],
  one_sample_conf_int_upper = res$conf.int[2],
  one_sample_parameter = unname(res$parameter),
  one_sample_estimate = unname(res$estimate)
)

# --- Scenario 2: one_sample_less ---
res <- t.test(data1, mu = 2.0, alternative = "less")
one_sample_less <- list(
  one_sample_less_statistic = unname(res$statistic),
  one_sample_less_p_value = res$p.value,
  one_sample_less_conf_int_lower = res$conf.int[1],
  one_sample_less_conf_int_upper = res$conf.int[2],
  one_sample_less_parameter = unname(res$parameter),
  one_sample_less_estimate = unname(res$estimate)
)

# --- Scenario 3: independent_equal_var ---
x <- c(5.1, 4.9, 5.3, 5.0, 5.2)
y <- c(4.5, 4.3, 4.7, 4.4, 4.6)
res <- t.test(x, y, var.equal = TRUE, alternative = "two.sided")
independent_equal_var <- list(
  independent_equal_var_statistic = unname(res$statistic),
  independent_equal_var_p_value = res$p.value,
  independent_equal_var_conf_int_lower = res$conf.int[1],
  independent_equal_var_conf_int_upper = res$conf.int[2],
  independent_equal_var_parameter = unname(res$parameter),
  independent_equal_var_estimate_x = unname(res$estimate[1]),
  independent_equal_var_estimate_y = unname(res$estimate[2])
)

# --- Scenario 4: independent_welch ---
res <- t.test(x, y, var.equal = FALSE, alternative = "two.sided")
independent_welch <- list(
  independent_welch_statistic = unname(res$statistic),
  independent_welch_p_value = res$p.value,
  independent_welch_conf_int_lower = res$conf.int[1],
  independent_welch_conf_int_upper = res$conf.int[2],
  independent_welch_parameter = unname(res$parameter),
  independent_welch_estimate_x = unname(res$estimate[1]),
  independent_welch_estimate_y = unname(res$estimate[2])
)

# --- Scenario 5: independent_greater ---
res <- t.test(x, y, var.equal = TRUE, alternative = "greater")
independent_greater <- list(
  independent_greater_statistic = unname(res$statistic),
  independent_greater_p_value = res$p.value,
  independent_greater_conf_int_lower = res$conf.int[1],
  independent_greater_conf_int_upper = res$conf.int[2],
  independent_greater_parameter = unname(res$parameter),
  independent_greater_estimate_x = unname(res$estimate[1]),
  independent_greater_estimate_y = unname(res$estimate[2])
)

# --- Scenario 6: paired ---
px <- c(85, 90, 78, 92, 88)
py <- c(80, 85, 75, 89, 84)
res <- t.test(px, py, paired = TRUE, alternative = "two.sided")
paired <- list(
  paired_statistic = unname(res$statistic),
  paired_p_value = res$p.value,
  paired_conf_int_lower = res$conf.int[1],
  paired_conf_int_upper = res$conf.int[2],
  paired_parameter = unname(res$parameter),
  paired_estimate = unname(res$estimate)
)

# --- Scenario 7: paired_less ---
res <- t.test(px, py, paired = TRUE, alternative = "less")
paired_less <- list(
  paired_less_statistic = unname(res$statistic),
  paired_less_p_value = res$p.value,
  paired_less_conf_int_lower = res$conf.int[1],
  paired_less_conf_int_upper = res$conf.int[2],
  paired_less_parameter = unname(res$parameter),
  paired_less_estimate = unname(res$estimate)
)

# --- Scenario 8: large_effect ---
lx <- c(10, 11, 12, 13, 14)
ly <- c(1, 2, 3, 4, 5)
res <- t.test(lx, ly, var.equal = TRUE, alternative = "two.sided")
large_effect <- list(
  large_effect_statistic = unname(res$statistic),
  large_effect_p_value = res$p.value,
  large_effect_conf_int_lower = res$conf.int[1],
  large_effect_conf_int_upper = res$conf.int[2],
  large_effect_parameter = unname(res$parameter),
  large_effect_estimate_x = unname(res$estimate[1]),
  large_effect_estimate_y = unname(res$estimate[2])
)

# --- Scenario 9: independent_less ---
res <- t.test(x, y, var.equal = TRUE, alternative = "less")
independent_less <- list(
  independent_less_statistic = unname(res$statistic),
  independent_less_p_value = res$p.value,
  independent_less_conf_int_lower = res$conf.int[1],
  independent_less_conf_int_upper = res$conf.int[2],
  independent_less_parameter = unname(res$parameter),
  independent_less_estimate_x = unname(res$estimate[1]),
  independent_less_estimate_y = unname(res$estimate[2])
)

# --- Scenario 10: one_sample_alpha_01 ---
res <- t.test(data1, mu = 2.0, alternative = "two.sided", conf.level = 0.99)
one_sample_alpha_01 <- list(
  one_sample_alpha_01_statistic = unname(res$statistic),
  one_sample_alpha_01_p_value = res$p.value,
  one_sample_alpha_01_conf_int_lower = res$conf.int[1],
  one_sample_alpha_01_conf_int_upper = res$conf.int[2],
  one_sample_alpha_01_parameter = unname(res$parameter)
)

# Emit all results as a single flat object
emit_reference(c(
  one_sample,
  one_sample_less,
  independent_equal_var,
  independent_welch,
  independent_greater,
  paired,
  paired_less,
  large_effect,
  independent_less,
  one_sample_alpha_01
))
