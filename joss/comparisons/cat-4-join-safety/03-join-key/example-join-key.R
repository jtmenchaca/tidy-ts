# Error Class 3: Join Key Errors
#
# R/dplyr join errors are caught at runtime. Missing keys produce errors,
# but some issues (like implicit cartesian joins from duplicate keys)
# silently inflate the result.

library(tidyverse)

patients <- read_csv("fixtures/patients.csv")
encounters <- read_csv("fixtures/encounters.csv")
labs <- read_csv("fixtures/lab_results.csv")

# ── ERROR 3a: Join key doesn't exist in one table ───────────────────────
# RUNTIME ERROR: Join columns must be present in data.
patients %>%
  left_join(labs, by = "encounter_id")
# Error: `encounter_id` not found in `x`

# ── ERROR 3b: Misspelled join key ───────────────────────────────────────
# RUNTIME ERROR: Column not found
patients %>%
  left_join(encounters, by = "patient_ID")

# ── ERROR 3c: Using columns from wrong table post-join ──────────────────
# RUNTIME ERROR: Column `prescription_id` doesn't exist.
patients %>%
  left_join(encounters, by = "patient_id") %>%
  mutate(note = prescription_id)
# Only caught when the pipeline actually runs
