"""
Error Class 31: Nullable vs Optional Distinction

Python has no distinction between null and undefined. Both empty cells
and missing columns become NaN. You can't tell whether a value was
explicitly missing or the field didn't exist.
"""
import pandas as pd
import numpy as np

df = pd.DataFrame({
    "patient_id": ["P001", "P002"],
    "lab_value": [100, np.nan],  # explicitly missing
})

# No way to distinguish "explicitly null" from "field doesn't exist"
print(pd.isna(df["lab_value"].iloc[1]))  # True
# Both empty cell and missing column → NaN. No semantic distinction.
