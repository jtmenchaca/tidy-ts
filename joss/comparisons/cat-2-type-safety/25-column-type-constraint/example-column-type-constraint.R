# Error Class 25: Column Type Constraint in Specialized Verbs
#
# R's across(where(is.numeric), fn) correctly filters columns at runtime,
# but if you manually specify columns, there's no compile-time check
# that they match the expected type.

library(tidyverse)

patients <- tibble(
  name = c("Alice", "Bob"),
  age = c(30, 45),
  weight = c(65.5, 80.0),
  insurance = c("Medicare", "Medicaid")
)

# across(where(is.numeric)) correctly selects numeric columns at runtime
result <- patients %>% mutate(across(where(is.numeric), log))
print(result)

# But manually specifying wrong columns errors at runtime:
# patients %>% mutate(across(c(age, insurance), log))
# Error: non-numeric argument to mathematical function
