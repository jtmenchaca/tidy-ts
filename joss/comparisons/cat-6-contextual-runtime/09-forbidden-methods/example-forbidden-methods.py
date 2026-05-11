"""
Error Class 9: Unintended Escape from DataFrame API

Python DataFrames don't prevent you from using raw Python operations
that bypass the DataFrame API. This can silently produce wrong results
or lose DataFrame metadata.
"""
import pandas as pd

patients = pd.DataFrame({
    "patient_id": ["P001", "P002", "P003"],
    "first_name": ["Maria", "James", "Abigail"],
    "age": [66, 49, 34],
})

# ── PROBLEM 9a: Using list comprehension instead of vectorized ops ──────
# Works but returns a plain list — loses DataFrame structure and index.
# No warning that you've left the pandas world.
names = [row["first_name"] for _, row in patients.iterrows()]
# Result is a plain Python list, not a Series or DataFrame

# ── PROBLEM 9b: Using .apply() with side effects ───────────────────────
# .apply() accepts any callable — no type checking on return values.
# If the function returns inconsistent types, pandas silently coerces.
def process(row):
    if row["age"] > 50:
        return row["age"]  # returns int
    return "young"          # returns str — column becomes object type silently

patients["status"] = patients.apply(process, axis=1)
print(patients["status"].dtype)  # object — mixed types, no warning

# ── PROBLEM 9c: Direct mutation via assignment ─────────────────────────
# pandas allows in-place mutation. No immutability guarantees.
patients.loc[0, "age"] = -5  # Invalid age — no type or range check
