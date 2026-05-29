suppressPackageStartupMessages(library(dplyr))
patients <- tibble(
  patient_id = c("P001"),
  first_name = c("Alice"),
  last_name = c("Smith")
)
patients <- patients %>% mutate(full_name = paste(patientId, last_name))