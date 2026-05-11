# Error Class 24: Window Function Output Type
#
# R's lag() silently introduces NA for shifted positions.
# Arithmetic on the result propagates NA without warning.

library(tidyverse)

values <- c(100, 200, 300, 400)

# SILENT: lag() introduces NA at the start
lagged <- lag(values)
print(lagged)  # NA, 100, 200, 300

# SILENT: Arithmetic on NA propagates — no error, no warning
diff <- lagged - values
print(diff)  # NA, -100, -100, -100 — first element is NA
