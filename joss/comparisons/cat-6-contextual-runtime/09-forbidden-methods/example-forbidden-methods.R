# Error Class 9: Unintended Escape from DataFrame API
#
# R tibbles don't prevent you from using base R operations that
# bypass tidyverse safety. Direct indexing, $ access, and base
# functions can silently produce wrong results.

library(tidyverse)

patients <- tibble(
  patient_id = c("P001", "P002", "P003"),
  first_name = c("Maria", "James", "Abigail"),
  age = c(66, 49, 34)
)

# ── PROBLEM 9a: Using base R $ with typo ───────────────────────────────
# SILENT: $ on tibble with wrong column name returns NULL — no error.
names <- patients$fist_name  # Typo: 'fist_name' instead of 'first_name'
print(names)
# NULL — no error, no warning. Downstream code using this will fail
# or produce wrong results much later.

# ── PROBLEM 9b: Direct vector assignment bypasses type safety ───────────
# No type checking on assignment. You can put anything in any column.
patients$age[1] <- "old"  # Coerces entire column to character — silently
print(patients$age)
# [1] "old" "49"  "34" — all ages are now strings

# ── PROBLEM 9c: sapply returns inconsistent types ──────────────────────
# sapply() can return a vector, matrix, or list depending on results.
# No type guarantee on what comes back.
result <- sapply(patients$age, function(x) {
  if (x > 50) return(x)
  return("young")
})
# Returns a character vector — coerced the numbers to strings silently
