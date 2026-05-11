"""
Error Class 6: Schema Validation at Data Boundaries

Python/pandas reads CSV files with inferred types. There is no upfront
schema validation. Type issues, missing columns, and malformed data
are discovered gradually — sometimes silently, sometimes much later.
"""
import pandas as pd

# ── PROBLEM 6a: No schema validation at load ───────────────────────────
# pandas infers types. If result_value has a non-numeric value like "pending",
# the entire column becomes object (string) type — silently.
labs = pd.read_csv("fixtures/lab_results.csv")

# You can add dtype specifications, but they error at runtime, not compile time
# labs = pd.read_csv("fixtures/lab_results.csv", dtype={"result_value": float})
# ValueError at runtime if any value can't be converted — but only then

# ── PROBLEM 6b: Missing columns discovered late ────────────────────────
# If the CSV is missing a column, you won't know until you access it.
# No upfront validation.
try:
    print(labs["nonexistent_column"])
except KeyError:
    print("KeyError — discovered only when accessed, not at load time")

# ── PROBLEM 6c: NaN for missing required values ────────────────────────
# Empty cells become NaN. There's no way to declare "this column must not
# have missing values" at load time.
print(labs["result_value"].dtype)  # float64 — but could contain NaN
print(f"Null count: {labs['result_value'].isna().sum()}")
# No error even if nulls exist in a column that should be non-null

# ── PROBLEM 6d: No compile-time tracking ───────────────────────────────
# After loading, any column reference is unchecked until runtime.
# Typos, wrong column names, removed columns — all runtime errors.
filtered = labs[labs["reslt_value"] > 100]  # Typo — KeyError at runtime
