library(tidyverse)

labs <- tibble(
  patient_id = c("A", "B", "C"),
  result = c(5.2, "MISSING", 7.1)
)

analyzed <- labs %>%
  mutate(doubled = result * 2)

print(analyzed)
