# Error Class 2: Type Mismatch Errors
#
# R is dynamically typed. Type coercion often happens silently,
# producing unexpected results rather than errors.

library(tidyverse)

labs <- read_csv("fixtures/lab_results.csv")
meds <- read_csv("fixtures/medications.csv")

# ── ERROR 2a: Arithmetic on a string column ─────────────────────────────
# RUNTIME WARNING: NAs introduced by coercion
# R tries to coerce "BNP" to numeric, gets NA, then adds 10 → NA
labs %>%
  mutate(adjusted = test_name + 10)

# ── ERROR 2b: Passing string column to numeric aggregation ──────────────
# RUNTIME WARNING: argument is not numeric or logical: returning NA
labs %>%
  group_by(test_name) %>%
  summarise(avg = mean(test_name))
# Returns NA for every group — warning only, not error

# ── ERROR 2c: Comparing incompatible types ──────────────────────────────
# SILENT: R coerces "high" → NA, then NA == number → NA → filtered out
# Produces empty tibble with no error
labs %>%
  filter(result_value == "high")
