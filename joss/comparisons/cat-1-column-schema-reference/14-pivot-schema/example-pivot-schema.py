"""
Error Class 14: Pivot Type Safety

Python/pandas pivot produces columns from data values. There is no
compile-time knowledge of what columns the pivot will create. Wrong
column references are only caught at runtime.
"""
import pandas as pd

vitals = pd.DataFrame({
    "patient_id": ["P001", "P001", "P001", "P002", "P002", "P002"],
    "metric": ["systolic", "diastolic", "heart_rate", "systolic", "diastolic", "heart_rate"],
    "value": [130, 85, 72, 145, 92, 88],
})

wide = vitals.pivot(index="patient_id", columns="metric", values="value").reset_index()
wide.columns.name = None

# RUNTIME: KeyError if accessing a column that wasn't in the data
try:
    fever = wide["temperature"]  # KeyError
except KeyError:
    pass

# RUNTIME: KeyError if referencing pre-pivot columns
try:
    filtered = wide[wide["metric"] == "systolic"]  # KeyError — gone after pivot
except KeyError:
    pass

# No compile-time indication of what columns exist after pivot
print(wide.columns.tolist())  # Only known at runtime
