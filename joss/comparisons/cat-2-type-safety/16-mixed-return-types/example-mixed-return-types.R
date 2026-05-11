# Error Class 16: Return Type Consistency in Mutate
#
# R silently coerces mixed return types. If a mutate returns both
# numbers and strings, the entire column becomes character — silently.

library(tidyverse)

labs <- tibble(
  patient_id = c("P001", "P002", "P003"),
  test_name = c("BNP", "WBC", "Glucose"),
  result_value = c(1250, 15.2, 210)
)

# SILENT: ifelse returning mixed types → character coercion
labs <- labs %>%
  mutate(status = ifelse(result_value > 100, "HIGH", result_value))
print(class(labs$status))  # character — numbers coerced to strings silently
print(labs$status)
# "HIGH", "15.2", "HIGH" — all strings now, no warning

# SILENT: Subsequent arithmetic fails because column is character
# labs %>% mutate(doubled = status * 2)
# Error: non-numeric argument to binary operator
# But only if you try to use it as numeric — the coercion itself is silent
