# Error Class 7: Pipeline Composition Errors
#
# In R, multi-step tidyverse pipelines have no compile-time schema tracking.
# Column references use non-standard evaluation — typos and references to
# columns removed by earlier steps fail only at runtime.

library(tidyverse)

patients <- read_csv("fixtures/patients.csv")
encounters <- read_csv("fixtures/encounters.csv")
labs <- read_csv("fixtures/lab_results.csv")
meds <- read_csv("fixtures/medications.csv")

# ── ERROR 7a: Wrong column after rename ─────────────────────────────────
# RUNTIME ERROR: Column `department` doesn't exist — was renamed to `dept`.
encounters %>%
  rename(dept = department) %>%
  filter(department == "ICU")

# ── ERROR 7b: Wrong column after multi-step transformation ──────────────
# RUNTIME ERROR: Column `department` doesn't exist after summarise.
encounters %>%
  left_join(labs, by = c("encounter_id", "patient_id")) %>%
  select(patient_id, department, test_name, result_value) %>%
  group_by(patient_id) %>%
  summarise(max_lab = max(result_value)) %>%
  mutate(dept = department)  # Error — department gone after summarise

# ── CORRECT (but unchecked) pipeline ────────────────────────────────────
# This works, but R validates nothing until the pipeline executes.
# A typo anywhere in this chain fails only at runtime.
report <- encounters %>%
  left_join(labs, by = c("encounter_id", "patient_id")) %>%
  filter(abnormal_flag == "H") %>%
  group_by(patient_id) %>%
  summarise(
    abnormal_count = n(),
    max_result = max(result_value),
    tests = paste(unique(test_name), collapse = ", ")
  ) %>%
  left_join(patients, by = "patient_id") %>%
  mutate(full_name = paste0(last_name, ", ", first_name)) %>%
  select(full_name, insurance_type, abnormal_count, max_result, tests) %>%
  arrange(desc(abnormal_count))

print(report)
