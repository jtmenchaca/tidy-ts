"""
Error Class 35: Pivot Column Validation

Python's pivot_table silently creates NaN for missing combinations.
If you expect a column that doesn't exist in the data, it just
doesn't appear — no error, no warning.
"""
import pandas as pd
import numpy as np

labs = pd.DataFrame({
    "patient_id": ["P001", "P001", "P002"],
    "test": ["BNP", "WBC", "BNP"],
    "value": [1250, 15.2, 450],
})

# SILENT: pivot_table creates NaN for missing combinations
pivoted = labs.pivot_table(index="patient_id", columns="test", values="value")
print(pivoted)
# P002 WBC is NaN — no warning that data is incomplete

# SILENT: No way to validate expected columns exist
has_troponin = "Troponin" in pivoted.columns
print(f"Troponin column exists: {has_troponin}")  # False — silently missing
