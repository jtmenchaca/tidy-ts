"""
Error Class 2: Type Mismatch Errors

Python/pandas uses dynamic typing. Arithmetic on string columns,
type mismatches in comparisons, and aggregation errors are only
discovered at runtime — or worse, silently produce wrong results.
"""
import pandas as pd

labs = pd.read_csv("fixtures/lab_results.csv")
meds = pd.read_csv("fixtures/medications.csv")

# ── ERROR 2a: Arithmetic on a string column ─────────────────────────────
# RUNTIME: TypeError — but only when this line executes.
# If this is in a rarely-hit branch, the bug survives to production.
labs["adjusted"] = labs["test_name"] + 10

# ── ERROR 2b: Passing string column to numeric aggregation ──────────────
# SILENT: pandas .mean() on strings returns NaN without error
avg_name = labs.groupby("test_name")["test_name"].mean()
# Returns NaN for every group — no error, no warning

# ── ERROR 2c: Comparing incompatible types ──────────────────────────────
# SILENT: This comparison always returns False for every row,
# producing an empty DataFrame — no error raised
wrong_filter = labs[labs["result_value"] == "high"]
print(f"Rows found: {len(wrong_filter)}")  # Prints 0, no warning
