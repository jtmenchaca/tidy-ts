# Error Class 18: Column Name Collision in Joins
#
# When joining tibbles with shared non-key column names, dplyr silently
# appends .x and .y suffixes. You must discover these at runtime —
# there's no compile-time indication that 'date' became 'date.x' and 'date.y'.

library(tidyverse)

admissions <- tibble(
  patient_id = c("P001", "P002"),
  date = c("2024-01-15", "2024-02-20"),
  department = c("ED", "ICU")
)

discharges <- tibble(
  patient_id = c("P001", "P002"),
  date = c("2024-01-18", "2024-02-25"),
  disposition = c("Home", "SNF")
)

# Join — 'date' exists in both, dplyr silently renames to date.x, date.y
joined <- admissions %>% inner_join(discharges, by = "patient_id")
print(names(joined))
# "patient_id" "date.x" "department" "date.y" "disposition"

# The suffix names are discoverable only by inspecting the result
print(joined %>% select(date.x, date.y))
