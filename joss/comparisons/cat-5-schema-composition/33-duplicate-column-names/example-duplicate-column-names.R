# Error Class 33: Duplicate Column Name Detection
#
# R's tibble rejects duplicate column names (error), but base
# data.frame silently makes them unique with suffixes.

library(tidyverse)

# tibble rejects duplicates — error
# tibble(id = 1, name = "Alice", name = "Bob")
# Error: Column name `name` must not be duplicated.

# data.frame silently makes unique
df <- data.frame(id = 1, name = "Alice", name = "Bob", check.names = FALSE)
print(names(df))  # "id" "name" "name" — duplicates allowed!
