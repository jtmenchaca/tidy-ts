# ID: SO#26401116
# Language: R
# Bug class: Value type
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: Same int/double inconsistency from median() in data.table groupby. Not verified with R runtime — .R file written from SO code.
# Reproduction status: Fixed (data.table later enforces consistent return types)
# Type system catch: Grouped aggregation enforces consistent return type across groups

library(data.table)

DT <- data.table(
  V1 = c(2L, 3L, 1L, 1L, 1L, 0L),
  V2 = c(1L, 2L, 1L, 2L, 1L, 1L),
  V7 = factor(c(1, 2, 3, 2, 3, 3))
)

# median on integer columns: odd groups → integer, even groups → double → crash
DT[, lapply(.SD, median), by = V7]
# Error: Column 1 of result for group X is type 'integer' but expecting type 'double'.
# Column types must be consistent for each group.
