library(tidyverse)

patients <- tibble(
  patient_id = c("P001", "P002", "P003"),
  name = c("Alice", "Bob", "Carol")
)

encounters <- tibble(
  patient_id = c("P001", "P001", "P002"),
  los_days = c(3, 7, NA)
)

joined <- patients %>%
  left_join(encounters, by = "patient_id")

# los_days is NA for unmatched patients
joined <- joined %>%
  mutate(los_weeks = los_days / 7)

# No error. No warning.
print(joined)
