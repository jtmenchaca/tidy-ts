# ID: SO#14023423
# Language: R
# Bug class: Value type
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: caret preProcess fails on factor columns. Numeric function on non-numeric type.
# Reproduction status: Live
# Type system catch: `Record<string, number>` rejects string column

library(earth)
library(caret)
data(etitanic)

# BUG: preProcess requires all numeric, but etitanic has factors
a <- preProcess(etitanic, method = c("center", "scale"))
# Error: all columns of x must be numeric
