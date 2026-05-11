# Error Class 5: Null Safety Errors
#
# R uses NA for missing values. NA propagates through all operations,
# and many functions silently return NA without warning.

library(tidyverse)

encounters <- read_csv("fixtures/encounters.csv")
labs <- read_csv("fixtures/lab_results.csv")

# ── ERROR 5a: Operations on NA values — silent propagation ──────────────
# discharge_date is NA for ED visits.
# String operations on NA silently produce NA — no warning.
encounters %>%
  mutate(los_label = str_sub(discharge_date, 1, 10))
# NA rows silently become NA — no indication of missing data

# ── ERROR 5b: Arithmetic with NA propagation ────────────────────────────
# reference_high is NA for some rows.
# Subtraction with NA → NA, silently.
labs %>%
  mutate(deviation = result_value - reference_high)
# NA values propagate through — easy to miss in large datasets

# ── ERROR 5c: mean() returns NA if any value is NA ─────────────────────
# This is the opposite problem: R's default is to propagate NA,
# which makes the entire aggregation NA unless you remember na.rm = TRUE.
labs %>%
  summarise(avg_ref = mean(reference_high))
# Returns NA — the developer must remember na.rm = TRUE every time.
# Forgetting this is a common source of bugs.

# With na.rm = TRUE it works, but there's no compile-time reminder
labs %>%
  summarise(avg_ref = mean(reference_high, na.rm = TRUE))
