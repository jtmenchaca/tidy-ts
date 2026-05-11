# Error Class 19: GroupBy State Tracking
#
# R's group_by returns a grouped tibble. Most dplyr verbs work but
# behave differently. The biggest trap: summarise on a multi-variable
# grouped tibble silently drops the last grouping level, meaning
# subsequent summarise calls aggregate differently than expected.

library(tidyverse)

labs <- tibble(
  patient_id = c("P001", "P001", "P002", "P002"),
  test_name = c("BNP", "WBC", "BNP", "WBC"),
  result_value = c(1250, 15.2, 450, 8.1)
)

# Group by two variables
grouped <- labs %>% group_by(patient_id, test_name)

# SILENT (with message): summarise drops last grouping variable
# Result is still grouped by patient_id
summary1 <- grouped %>% summarise(mean_val = mean(result_value))
# "`summarise()` has grouped output by 'patient_id'."
# But this message is easily missed, and the result is still grouped!
print(summary1)

# SILENT: A second summarise aggregates by patient_id (not ungrouped)
summary2 <- summary1 %>% summarise(grand_mean = mean(mean_val))
# This gives per-patient means, not an overall mean — surprising if
# you didn't notice the grouping was preserved
print(summary2)
