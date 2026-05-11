# Error Class 20: Implicit Type Coercion in Row Binding
#
# When binding rows from tibbles where the same column has different types,
# R silently coerces to the more general type (character). Subsequent
# numeric operations fail or produce NA.

library(tidyverse)

numeric_doses <- tibble(
  drug = c("Aspirin", "Lisinopril"),
  dose = c(325, 10)
)

text_doses <- tibble(
  drug = c("Insulin", "Warfarin"),
  dose = c("sliding scale", "per INR")
)

# SILENT: bind_rows coerces 'dose' to character — no error, no warning
combined <- bind_rows(numeric_doses, text_doses)
print(class(combined$dose))  # character
print(combined$dose)  # "325", "10", "sliding scale", "per INR"

# Arithmetic now fails or produces NA
# combined %>% mutate(doubled = as.numeric(dose) * 2)
# "sliding scale" → NA, "per INR" → NA (with warning)
