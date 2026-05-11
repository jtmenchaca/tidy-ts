# Error Class 35: Pivot Column Validation
#
# R's pivot_wider silently creates NA for missing combinations.
# No validation that expected pivot columns exist in the data.

library(tidyverse)

labs <- tibble(
  patient_id = c("P001", "P001", "P002"),
  test = c("BNP", "WBC", "BNP"),
  value = c(1250, 15.2, 450)
)

# SILENT: pivot_wider creates NA for missing combinations
pivoted <- labs %>% pivot_wider(names_from = test, values_from = value)
print(pivoted)
# P002 WBC is NA — no warning that data is incomplete
