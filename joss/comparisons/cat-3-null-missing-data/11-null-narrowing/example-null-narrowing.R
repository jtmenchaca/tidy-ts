# Error Class 11: Null Narrowing via replace_na / drop_na
#
# R's replace_na() and drop_na() remove NA values, but the language
# has no type-level tracking of nullability. After replacing NAs,
# there is no compile-time guarantee that NA is gone.

library(tidyverse)

labs <- read_csv("fixtures/lab_results.csv")

# ── PROBLEM 11a: replace_na doesn't change the type ────────────────────
# After replace_na, the column is still the same type.
# R has no concept of "this column is guaranteed non-NA".
labs <- labs %>%
  mutate(
    reference_high = replace_na(reference_high, 999),
    reference_low = replace_na(reference_low, 0)
  )
# No type-level guarantee that reference_high is now non-NA.
# You can still pass it to mean() without na.rm = TRUE and it will
# work — but only because you remembered to clean it first.

# ── PROBLEM 11b: Can re-introduce NA silently ──────────────────────────
# Nothing prevents setting a value back to NA after cleaning.
labs$reference_high[1] <- NA
# No error — the replace_na guarantee is silently broken.

# ── PROBLEM 11c: drop_na doesn't narrow types either ───────────────────
# After drop_na, columns are still the same type.
# No compile-time assurance that NA is absent.
clean <- labs %>% drop_na(reference_high, reference_low)
# clean$reference_high is still "numeric" — could theoretically have NA
# in the type system's view (if R had one).
