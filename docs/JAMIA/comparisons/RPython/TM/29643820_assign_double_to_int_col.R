# ID: SO#29643820
# Language: R
# Bug class: Value type
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: Assigning mean() (double) to integer column in data.table fails. Type of aggregation result doesn't match column type. Not verified with R runtime — .R file written from SO code.
# Reproduction status: Live
# Type system catch: Column type `integer` rejects `double` assignment

library(data.table)

db <- data.table(id = rep(1:2, each = 5), x = 1:10, y = runif(10))
print(db)

# x is integer, mean(y) is double → crash
db[, x := mean(y), by = id]
# Error: Type of RHS ('double') must match LHS ('integer').
