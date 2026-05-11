# Error Class 28: Reorder vs Select Schema Preservation
#
# R has both select() (drops unmentioned) and relocate() (keeps all).
# Using select() when you meant relocate() silently drops columns.

library(tidyverse)

patients <- tibble(
  patient_id = "P001",
  name = "Alice",
  age = 30,
  insurance = "Medicare"
)

# select() drops unmentioned columns — if you meant "reorder", data is lost
selected <- patients %>% select(name, patient_id)
print(names(selected))  # "name" "patient_id" — age, insurance gone!

# relocate() keeps all columns — correct for reordering
relocated <- patients %>% relocate(name, patient_id)
print(names(relocated))  # "name" "patient_id" "age" "insurance"
