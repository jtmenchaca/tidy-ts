# Error Class 4: Schema Evolution Through Pipelines
#
# After select/summarise, R does not track which columns remain.
# Referencing removed columns fails only at runtime.

library(tidyverse)

encounters <- read_csv("fixtures/encounters.csv")

# ── ERROR 4a: Accessing dropped column ──────────────────────────────────
# RUNTIME ERROR: Column `attending_physician` doesn't exist.
encounters %>%
  select(encounter_id, patient_id, department) %>%
  mutate(doc = attending_physician)

# ── ERROR 4b: Accessing original columns after summarise ────────────────
# RUNTIME ERROR: Column `encounter_type` doesn't exist.
encounters %>%
  group_by(department) %>%
  summarise(count = n()) %>%
  filter(encounter_type == "Inpatient")
# encounter_type is gone after summarise — R doesn't know until runtime

# ── ERROR 4c: Chaining after dropping a column ─────────────────────────
# RUNTIME ERROR: Column `attending_physician` doesn't exist.
encounters %>%
  select(-attending_physician) %>%
  arrange(attending_physician)
