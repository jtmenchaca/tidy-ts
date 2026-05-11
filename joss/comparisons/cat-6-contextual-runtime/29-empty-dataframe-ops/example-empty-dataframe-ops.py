"""
Error Class 29: Empty DataFrame Operations

Python silently allows operations on empty DataFrames,
producing empty results that may mask bugs.
"""
import pandas as pd

# Empty DataFrame
empty = pd.DataFrame()

# SILENT: Operations on empty DataFrame produce empty results — no warning
result = empty.groupby("x").sum() if "x" in empty.columns else pd.DataFrame()
print(f"empty groupby result: {len(result)} rows")  # 0 rows, no error

# SILENT: Aggregation on empty Series
empty_with_cols = pd.DataFrame({"x": pd.Series(dtype=float)})
total = empty_with_cols["x"].sum()
print(f"sum of empty: {total}")  # 0.0 — not NaN, not error
