# Error Class 1: Column Reference Errors
#
# Scenario: Referencing a misspelled or nonexistent column name
# in mutate, filter, or arrange operations.

library(tidyverse)

patients <- read_csv("fixtures/patients.csv")
labs <- read_csv("fixtures/lab_results.csv")

# ── ERROR 1a: Misspelled column name in mutate ─────────────────────────────
# 'patientId' does not exist; column is 'patient_id'
patients %>%
  mutate(full_name = paste(patientId, last_name))

# ── ERROR 1b: Nonexistent column in filter ──────────────────────────────────
# 'diagnosis' is not a column in the patients table
patients %>%
  filter(diagnosis == "I50.9")

# ── ERROR 1c: Misspelled column in arrange ──────────────────────────────────
# 'result_values' does not exist; column is 'result_value'
labs %>%
  arrange(desc(result_values))
