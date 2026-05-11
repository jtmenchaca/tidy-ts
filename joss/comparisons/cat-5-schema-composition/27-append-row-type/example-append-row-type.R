# Error Class 27: Append Row Type Mismatch
#
# R's bind_rows silently fills NA for missing columns
# and coerces types when binding incompatible rows.

library(tidyverse)

patients <- tibble(
  patient_id = "P001",
  name = "Alice",
  age = 30
)

# SILENT: Missing column filled with NA
new_row <- tibble(patient_id = "P002", name = "Bob")
combined <- bind_rows(patients, new_row)
print(combined)
# age for P002 is NA — no error, no warning
