# ID: SO#7920688
# Language: R
# Bug class: Join
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: data.table join key type mismatch (int vs double). Join key types must match.
# Reproduction status: Live
# Type system catch: Join key types must match

library(data.table)

dt1 <- data.table(A1 = letters[1:10], B1 = sample(1:5, 10, replace = TRUE))
dt2 <- data.table(A2 = letters[c(1:5, 11:15)], B2 = sample(1:5, 10, replace = TRUE))

setkey(dt1, A1)
setkey(dt2, A2)

# which=TRUE returns positions with NA for non-matches
positions <- dt1[dt2, which = TRUE]
cat("Positions:", positions, "\n")

# BUG: negative indexing with NAs crashes
tryCatch(
  dt1[-positions],
  error = function(e) cat("Crash:", conditionMessage(e), "\n")
)
