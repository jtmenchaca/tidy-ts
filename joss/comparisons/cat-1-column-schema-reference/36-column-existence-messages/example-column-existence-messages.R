# Error Class 36: Descriptive Runtime Error Messages
#
# R's dplyr gives better errors than Python, but still doesn't
# list all available columns in most error messages.

library(tidyverse)

patients <- tibble(
  patient_id = "P001",
  name = "Alice",
  department = "ED"
)

# R error: Column `dept` doesn't exist.
# Better than Python but no available column list
tryCatch(
  patients %>% group_by(dept),
  error = function(e) cat("Error:", conditionMessage(e), "\n")
)
