"""
Error Class 30: Transpose Type Safety

Python's .T (transpose) loses all type information. Column names
after transpose are the original index values — discoverable only
at runtime. Operations on transposed DataFrames have no type safety.
"""
import pandas as pd

vitals = pd.DataFrame({
    "metric": ["heart_rate", "bp_systolic", "bp_diastolic"],
    "P001": [72, 120, 80],
    "P002": [88, 140, 90],
})

# Set index and transpose — column names become runtime-only
vitals = vitals.set_index("metric")
transposed = vitals.T
print(transposed.columns.tolist())
# ['heart_rate', 'bp_systolic', 'bp_diastolic'] — known only at runtime

# SILENT: Accessing wrong column name — KeyError only at runtime
# transposed["nonexistent"]  # KeyError at runtime
