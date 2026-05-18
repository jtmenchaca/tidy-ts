# ID: SO#7960798
# Language: R
# Bug class: Nullable
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: NA returns logical type instead of numeric across groups. NA type conflicts.
# Reproduction status: Live
# Type system catch: `number` rejects `number | null`

library(data.table)

foo2 <- function(x) {
  if (mean(x) < 5) {
    return(1)
  } else {
    return(NA)
  }
}

DT <- data.table(ID = rep(c("A", "B"), each = 5), value = 1:10)
DT[, foo2(value), by = ID]
