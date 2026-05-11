"""
Error Class 13: Bind Rows Schema Mismatch

Python/pandas pd.concat() fills missing columns with NaN silently.
There is no type-level indication that some columns may be missing
for some rows.
"""
import pandas as pd
import numpy as np

labs_a = pd.DataFrame({
    "patient_id": ["P001", "P002"],
    "test_name": ["BNP", "WBC"],
    "result_value": [1250, 15.2],
    "lab_site": ["Main", "Main"],
})

labs_b = pd.DataFrame({
    "patient_id": ["P003", "P004"],
    "test_name": ["HbA1c", "Glucose"],
    "result_value": [8.9, 210],
    "reference_range": ["4.0-5.6", "70-100"],
})

# SILENT: pd.concat fills missing columns with NaN, no warning
combined = pd.concat([labs_a, labs_b], ignore_index=True)
print(combined)
# lab_site is NaN for rows from labs_b
# reference_range is NaN for rows from labs_a
# No error, no warning, no type-level indication

# SILENT: String operations on NaN propagate silently
combined["site_upper"] = combined["lab_site"].str.upper()
print(combined["site_upper"])
# NaN rows produce NaN — no indication of missing data
