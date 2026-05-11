"""
Error Class 12: Aggregation on Columns with Missing Data

Python/pandas silently skips NaN in aggregation by default.
mean(), sum(), std() all ignore NaN without any warning.
This can produce misleading summary statistics.
"""
import pandas as pd
import numpy as np

labs = pd.read_csv("fixtures/lab_results.csv")

# ── PROBLEM 12a: mean() silently skips NaN ─────────────────────────────
# SILENT: No error, no warning. NaN rows are excluded from the mean.
avg = labs["reference_high"].mean()
print(f"Mean reference_high: {avg}")
# This is the mean of only the non-NaN rows.
# No indication that some rows were excluded.

# ── PROBLEM 12b: sum() silently skips NaN ──────────────────────────────
# SILENT: Same behavior. NaN rows excluded without notice.
total = labs["reference_high"].sum()
print(f"Sum reference_high: {total}")
# You get a number, but it's not the sum of all rows.

# ── PROBLEM 12c: count vs size — subtle NaN difference ─────────────────
# .count() excludes NaN, .size() includes NaN rows.
# Easy to confuse these two, producing wrong denominators.
count = labs["reference_high"].count()
size = labs["reference_high"].size
print(f"count (excl NaN): {count}, size (incl NaN): {size}")
# If you divide sum by size instead of count, you get a wrong average.

# ── PROBLEM 12d: groupby + mean silently drops groups ──────────────────
# SILENT: Groups where all values are NaN are silently dropped.
by_test = labs.groupby("test_name")["reference_high"].mean()
print(by_test)
# Groups with all-NaN reference_high just disappear from the result.
