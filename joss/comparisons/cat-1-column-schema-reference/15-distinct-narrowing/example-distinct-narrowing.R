# Error Class 15: Distinct Column Narrowing
#
# R's distinct() with .keep_all = FALSE drops non-specified columns,
# but with .keep_all = TRUE keeps all columns with arbitrary values.
# There is no type-level tracking of which columns remain.

library(tidyverse)

encounters <- tibble(
  patient_id = c("P001", "P001", "P002", "P002"),
  department = c("Cardiology", "Cardiology", "Emergency", "Primary Care"),
  encounter_type = c("Outpatient", "Inpatient", "ED", "Outpatient"),
  physician = c("Dr. Patel", "Dr. Patel", "Dr. Lee", "Dr. Martinez")
)

# distinct without .keep_all drops extra columns
unique_depts <- encounters %>% distinct(patient_id, department)
print(unique_depts)
# physician is gone — but no type-level indication

# distinct with .keep_all keeps all columns with arbitrary values
unique_depts_all <- encounters %>% distinct(patient_id, department, .keep_all = TRUE)
print(unique_depts_all)
# physician column present — which value is kept is arbitrary
