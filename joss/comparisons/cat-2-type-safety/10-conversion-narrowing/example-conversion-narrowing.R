# Error Class 10: Type Conversion and Narrowing
#
# R type conversions produce NA for unparseable values with a warning.
# After conversion, the NA values propagate silently through all
# downstream operations. There is no compile-time type tracking.

library(tidyverse)

labs <- tibble(
  lab_id = c("L1", "L2", "L3"),
  patient_id = c("P001", "P001", "P002"),
  test_name = c("BNP", "pH", "WBC"),
  result_str = c("1250", "7.28", "pending")
)

# ── PROBLEM 10a: as.numeric() on non-numeric — WARNING + NA ────────────
# R warns "NAs introduced by coercion" but continues execution.
# The warning is easy to miss in long output.
labs <- labs %>%
  mutate(result_num = as.numeric(result_str))
# Warning message: NAs introduced by coercion
# "pending" → NA

# ── PROBLEM 10b: Downstream arithmetic on NA — SILENT ──────────────────
# After coercion, NA propagates silently. No further warnings.
labs <- labs %>%
  mutate(doubled = result_num * 2)
# NA * 2 = NA — no warning, no error

# ── PROBLEM 10c: Aggregation on NA — SILENT ────────────────────────────
# mean() returns NA if any value is NA. No warning.
avg <- mean(labs$result_num)
print(avg)  # NA — must remember na.rm = TRUE

# With na.rm = TRUE it works, but no compile-time reminder
avg_clean <- mean(labs$result_num, na.rm = TRUE)
print(avg_clean)  # 628.64
