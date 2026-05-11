# Error Class 12: Aggregation on Columns with Missing Data
#
# THIS IS THE MOST INSIDIOUS ERROR IN R:
# mean(), sum(), sd(), var(), min(), max() all return NA if ANY value
# is NA — with NO warning and NO error. The developer must remember
# to add na.rm = TRUE every single time.

library(tidyverse)

labs <- read_csv("fixtures/lab_results.csv")

# ── PROBLEM 12a: mean() returns NA — NO WARNING ────────────────────────
# SILENT: mean() with any NA returns NA. No error, no warning.
avg <- mean(labs$reference_high)
print(avg)  # NA
# This is not a warning. This is not an error. It's just... NA.
# In a long script, this NA propagates through everything downstream.

# ── PROBLEM 12b: sum() returns NA — NO WARNING ─────────────────────────
# SILENT: Same behavior.
total <- sum(labs$reference_high)
print(total)  # NA

# ── PROBLEM 12c: The na.rm trap ────────────────────────────────────────
# You must remember na.rm = TRUE for EVERY aggregation function.
# There is no mechanism to enforce this — it's pure developer discipline.
avg_clean <- mean(labs$reference_high, na.rm = TRUE)
print(avg_clean)  # correct value

# ── PROBLEM 12d: summarise with NA — SILENT ────────────────────────────
# SILENT: summarise returns NA for groups containing NA, no warning.
labs %>%
  group_by(test_name) %>%
  summarise(avg_ref = mean(reference_high))
# All groups with any NA in reference_high get avg_ref = NA.
# No warning that data is missing.

# Must remember na.rm = TRUE inside summarise too:
labs %>%
  group_by(test_name) %>%
  summarise(avg_ref = mean(reference_high, na.rm = TRUE))

# ── PROBLEM 12e: min/max with NA — SILENT + WARNING inconsistency ──────
# min() and max() DO warn, but only with a generic message.
# mean() and sum() do NOT warn. Inconsistent behavior.
min_val <- min(labs$reference_high, na.rm = FALSE)
# Warning: no non-missing arguments to min; returning Inf
# But mean() gives no such warning — easy to miss the pattern.
