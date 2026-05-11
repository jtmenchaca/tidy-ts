# Error Class 21: Aggregation Return Type Narrowing
#
# R's aggregation functions return NA when any value is NA (without na.rm).
# With na.rm=TRUE, they return a clean numeric. But there's no type-level
# difference — both are "numeric". You can do arithmetic on NA results
# and it just propagates NA silently.

library(tidyverse)

labs <- tibble(
  patient_id = c("P001", "P001", "P002"),
  test_name = c("BNP", "WBC", "BNP"),
  result_value = c(1250, NA, 450)
)

# SILENT: sum() returns NA — no warning
total <- sum(labs$result_value)
print(total)  # NA

# SILENT: Arithmetic on NA propagates — no warning
per_patient <- total / 2  # NA
print(per_patient)  # NA — wrong result, no indication
