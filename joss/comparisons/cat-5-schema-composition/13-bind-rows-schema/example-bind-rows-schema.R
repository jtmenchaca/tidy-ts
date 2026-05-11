# Error Class 13: Bind Rows Schema Mismatch
#
# R's bind_rows() fills missing columns with NA silently.
# There is no type-level indication that some columns may be missing.

library(tidyverse)

labs_a <- tibble(
  patient_id = c("P001", "P002"),
  test_name = c("BNP", "WBC"),
  result_value = c(1250, 15.2),
  lab_site = c("Main", "Main")
)

labs_b <- tibble(
  patient_id = c("P003", "P004"),
  test_name = c("HbA1c", "Glucose"),
  result_value = c(8.9, 210),
  reference_range = c("4.0-5.6", "70-100")
)

# SILENT: bind_rows fills missing columns with NA, no warning
combined <- bind_rows(labs_a, labs_b)
print(combined)
# lab_site is NA for rows from labs_b
# reference_range is NA for rows from labs_a

# SILENT: Operations on NA propagate silently
combined <- combined %>%
  mutate(site_upper = toupper(lab_site))
print(combined$site_upper)
# NA rows produce NA — no indication of missing data
