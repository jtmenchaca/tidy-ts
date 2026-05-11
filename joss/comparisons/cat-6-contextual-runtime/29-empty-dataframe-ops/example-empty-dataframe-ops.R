# Error Class 29: Empty DataFrame Operations
#
# R silently allows operations on empty tibbles,
# producing empty results that may mask bugs.

library(tidyverse)

# Empty tibble
empty <- tibble()

# SILENT: Operations on empty tibble produce empty results
# group_by on empty tibble — no error
empty_with_cols <- tibble(x = numeric())
result <- empty_with_cols %>% group_by(x) %>% summarise(total = sum(x))
cat("empty summarise result:", nrow(result), "rows\n")  # 0 rows, no error

# SILENT: sum of empty numeric — returns 0, not NA, not error
total <- sum(empty_with_cols$x)
cat("sum of empty:", total, "\n")  # 0 — may be unexpected
