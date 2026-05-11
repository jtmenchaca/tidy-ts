# Error Class 14: Pivot Type Safety
#
# R's pivot_wider creates columns from data values. Column names are
# determined at runtime. Typos or references to pre-pivot columns
# are only caught when the code runs.

library(tidyverse)

vitals <- tibble(
  patient_id = c("P001", "P001", "P001", "P002", "P002", "P002"),
  metric = c("systolic", "diastolic", "heart_rate", "systolic", "diastolic", "heart_rate"),
  value = c(130, 85, 72, 145, 92, 88)
)

wide <- vitals %>%
  pivot_wider(names_from = metric, values_from = value)

# RUNTIME ERROR: 'temperature' not found
# wide %>% mutate(fever = temperature > 100.4)

# RUNTIME ERROR: 'metric' gone after pivot
# wide %>% filter(metric == "systolic")

# No compile-time indication of what columns exist after pivot
print(colnames(wide))  # Only known at runtime
