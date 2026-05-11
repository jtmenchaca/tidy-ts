"""
Error Class 10: Type Conversion and Narrowing

Python/pandas type conversions are runtime operations with no
compile-time tracking. Failed conversions silently produce NaN
or raise runtime errors depending on the method used.
"""
import pandas as pd
import numpy as np

labs = pd.DataFrame({
    "lab_id": ["L1", "L2", "L3"],
    "patient_id": ["P001", "P001", "P002"],
    "test_name": ["BNP", "pH", "WBC"],
    "result_str": ["1250", "7.28", "pending"],
})

# ── PROBLEM 10a: pd.to_numeric with default errors='raise' ─────────────
# RUNTIME: ValueError when encountering non-numeric "pending"
try:
    labs["result_num"] = pd.to_numeric(labs["result_str"])
except ValueError as e:
    print(f"ValueError: {e}")  # Only caught at runtime

# ── PROBLEM 10b: pd.to_numeric with errors='coerce' — silent NaN ───────
# No error, no warning. "pending" silently becomes NaN.
labs["result_num"] = pd.to_numeric(labs["result_str"], errors="coerce")
print(labs["result_num"])
# 0    1250.0
# 1       7.28
# 2       NaN   ← silent conversion failure

# ── PROBLEM 10c: Downstream arithmetic on NaN — silent propagation ──────
# After coercion, NaN propagates through arithmetic with no warning.
labs["doubled"] = labs["result_num"] * 2
print(labs["doubled"])
# 0    2500.0
# 1      14.56
# 2       NaN   ← silently propagated, no indication of source

# ── PROBLEM 10d: No type tracking after conversion ─────────────────────
# Python doesn't know that result_num might be NaN.
# No compile-time enforcement to handle missing values.
avg = labs["result_num"].mean()  # Silently ignores NaN
print(f"Average: {avg}")  # Average of valid values only — no warning
