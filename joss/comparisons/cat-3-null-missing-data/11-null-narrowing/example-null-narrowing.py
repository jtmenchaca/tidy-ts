"""
Error Class 11: Null Narrowing via fillna

Python/pandas fillna() replaces NaN values, but it does not change
the column's dtype or provide any compile-time guarantee that NaN
values are gone. Downstream code still has no assurance.
"""
import pandas as pd
import numpy as np

labs = pd.read_csv("fixtures/lab_results.csv")

# ── PROBLEM 11a: fillna doesn't change the dtype ───────────────────────
# After fillna, the column is still float64 (not int or guaranteed non-null).
# No type-level narrowing.
print(f"Before fillna: {labs['reference_high'].dtype}")  # float64
labs["reference_high"] = labs["reference_high"].fillna(999)
print(f"After fillna: {labs['reference_high'].dtype}")   # still float64

# Python doesn't "know" that NaN values are gone.
# There's no compile-time guarantee.

# ── PROBLEM 11b: Can still introduce NaN after fillna ──────────────────
# Nothing prevents re-introducing NaN into a "cleaned" column.
labs.loc[0, "reference_high"] = np.nan
# No error — the fillna guarantee is lost, silently.

# ── PROBLEM 11c: dropna doesn't narrow types either ────────────────────
# After dropna, columns still have nullable dtypes.
clean = labs.dropna(subset=["reference_high", "reference_low"])
print(f"After dropna: {clean['reference_high'].dtype}")  # still float64
# No compile-time assurance that NaN is absent
