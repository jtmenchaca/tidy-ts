# Error Class 31: Nullable vs Optional Distinction
#
# R has no distinction between null and undefined. Both empty cells
# and missing columns become NA. No semantic difference.

library(tidyverse)

df <- tibble(
  patient_id = c("P001", "P002"),
  lab_value = c(100, NA)  # explicitly missing
)

# No way to distinguish "explicitly null" from "field doesn't exist"
print(is.na(df$lab_value[2]))  # TRUE
# Both → NA. No semantic distinction.
