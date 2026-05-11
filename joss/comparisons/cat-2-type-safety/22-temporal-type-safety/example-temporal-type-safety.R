# Error Class 22: Temporal Type Safety
#
# R's as.Date produces NA for invalid dates with only a warning.
# Arithmetic on NA dates propagates silently.

library(tidyverse)

encounters <- tibble(
  patient_id = c("P001", "P002", "P003"),
  admit_date = c("2024-01-15", "2024-02-20", "not-a-date"),
  los_days = c(3, 7, 5)
)

# WARNING: Invalid date becomes NA
encounters <- encounters %>%
  mutate(admit_date = as.Date(admit_date))
# Warning: NAs introduced by coercion — but execution continues

# SILENT: Arithmetic on NA date propagates
encounters <- encounters %>%
  mutate(discharge = admit_date + los_days)
print(encounters$discharge)  # P003: NA — silently wrong
