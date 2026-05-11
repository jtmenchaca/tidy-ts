# Error Class 17: Join Nullability
#
# After a left_join, unmatched rows get NA for right-side columns.
# R silently lets you operate on these NA values — arithmetic
# propagates NA, string methods produce NA, and comparisons return
# NA (which filter() silently drops).

library(tidyverse)

patients <- tibble(
  patient_id = c("P001", "P002", "P003"),
  name = c("Alice Johnson", "Bob Smith", "Carol Davis")
)

encounters <- tibble(
  patient_id = c("P001", "P001"),
  department = c("Emergency", "ICU"),
  los_days = c(3, 7)
)

# Left join — P002 and P003 have NA for department and los_days
joined <- patients %>% left_join(encounters, by = "patient_id")

# SILENT: toupper() on NA produces NA — no error, no warning
joined <- joined %>% mutate(dept_upper = toupper(department))
print(joined %>% select(patient_id, department, dept_upper))
# P002: NA → NA, P003: NA → NA

# SILENT: Arithmetic on NA propagates — no error, no warning
joined <- joined %>% mutate(los_weeks = los_days / 7)
print(joined %>% select(patient_id, los_days, los_weeks))
# P002: NA → NA, P003: NA → NA

# SILENT: filter() drops NA rows — no error, no warning
long_stays <- joined %>% filter(los_days > 5)
cat("Rows with los > 5:", nrow(long_stays), "\n")
# NA rows silently dropped
