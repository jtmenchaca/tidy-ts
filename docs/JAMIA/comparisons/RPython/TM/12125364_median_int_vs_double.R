# ID: SO#12125364
# Language: R
# Bug class: Value type
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: median() returns int for odd-length groups, double for even-length. data.table crashes on inconsistent return types across groups. Not verified with R runtime — .R file written from SO code.
# Reproduction status: Fixed (data.table later enforces consistent return types)
# Type system catch: Grouped aggregation enforces consistent return type across groups

library(data.table)

set.seed(42)
enc.per.day <- data.table(
  DOS = as.Date("2023-01-01") + 0:13,
  n = as.integer(c(3, 5, 2, 7, 4, 6, 1, 8, 3, 5, 2, 7, 4, 6))
)

# median of odd-length group returns integer, even-length returns double
# data.table requires consistent types across groups → crash
enc.per.day[, list(patient.encounters = median(n)), by = list(weekdays(DOS))]
# Error: Column 1 of result for group X is type 'double' but expecting type 'integer'
