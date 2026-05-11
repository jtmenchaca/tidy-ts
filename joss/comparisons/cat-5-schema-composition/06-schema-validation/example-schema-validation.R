# Error Class 6: Schema Validation at Data Boundaries
#
# R/readr infers types from the first 1000 rows. There is no upfront
# schema contract. Type mismatches are warnings, not errors, and missing
# columns are only discovered when accessed.

library(tidyverse)

# ── PROBLEM 6a: Type inference, not validation ──────────────────────────
# read_csv guesses column types from the first 1000 rows.
# If row 1001 has "pending" in result_value, the column becomes character.
# Earlier rows' numbers become strings — silently.
labs <- read_csv("fixtures/lab_results.csv")

# You can specify col_types, but mismatches produce warnings, not errors:
# labs <- read_csv("fixtures/lab_results.csv", col_types = cols(
#   result_value = col_double()
# ))
# Parsing failures produce a warning and the offending values become NA

# ── PROBLEM 6b: Missing columns discovered late ────────────────────────
# If the CSV is missing a column, read_csv succeeds.
# You only find out when you try to use it.
# labs %>% mutate(x = nonexistent_column)
# Error: object 'nonexistent_column' not found — runtime only

# ── PROBLEM 6c: NA for missing required values ─────────────────────────
# Empty cells become NA. There's no way to declare "this column must
# not have NA" at load time.
summary(labs$result_value)  # Shows NA count, but doesn't prevent them

# ── PROBLEM 6d: No compile-time tracking ───────────────────────────────
# After loading, all column references are checked at runtime only.
labs %>%
  filter(reslt_value > 100)  # Typo — runtime error
