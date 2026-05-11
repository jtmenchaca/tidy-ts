# Error Class 26: Sorting on Nullable Columns
#
# R silently sorts NA values to the end with arrange().
# No warning is given about the implicit NA placement.

library(tidyverse)

labs <- tibble(
  patient_id = c("P001", "P002", "P003"),
  result_value = c(100, NA, 50)
)

# SILENT: NA rows sorted to end — no warning
sorted_df <- labs %>% arrange(result_value)
print(sorted_df)
# P003: 50, P001: 100, P002: NA — NA silently at end
