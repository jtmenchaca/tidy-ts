"""
Error Class 21: Aggregation Return Type Narrowing

Python's aggregation functions silently skip NaN values by default.
The return type is always float64 — there's no type-level distinction
between "sum with NaN removed" and "sum of clean data".
"""
import pandas as pd
import numpy as np

labs = pd.DataFrame({
    "patient_id": ["P001", "P001", "P002"],
    "test_name": ["BNP", "WBC", "BNP"],
    "result_value": [1250, np.nan, 450],
})

# SILENT: sum() skips NaN by default — no indication that data was incomplete
total = labs["result_value"].sum()  # 1700.0, not NaN
print(f"sum = {total}")  # Looks correct but silently excluded missing data

# SILENT: No type difference between clean sum and NaN-skipping sum
per_patient = total / 2  # Works fine — but was the NaN intentional?
print(f"per_patient = {per_patient}")
