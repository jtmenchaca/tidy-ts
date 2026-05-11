# Error Class 30: Transpose Type Safety
#
# R's t() converts tibble to matrix, losing all type information.
# Column names after transpose are the original row names, discoverable
# only at runtime.

library(tidyverse)

vitals <- tibble(
  metric = c("heart_rate", "bp_systolic", "bp_diastolic"),
  P001 = c(72, 120, 80),
  P002 = c(88, 140, 90)
)

# t() converts to matrix — all types become character or numeric
transposed <- t(vitals[, -1])
colnames(transposed) <- vitals$metric
print(transposed)
# Column names only known at runtime

# SILENT: Everything becomes matrix — no tibble structure
print(class(transposed))  # "matrix" "array" — not tibble anymore
