"""
Error Class 26: Sorting on Nullable Columns

Python silently sorts NaN values to the end by default.
The na_position parameter exists but is optional — the default
behavior is implicit and undocumented at the point of use.
"""
import pandas as pd
import numpy as np

labs = pd.DataFrame({
    "patient_id": ["P001", "P002", "P003"],
    "result_value": [100, np.nan, 50],
})

# SILENT: NaN rows sorted to end — no warning about implicit behavior
sorted_df = labs.sort_values("result_value")
print(sorted_df)
# P003: 50, P001: 100, P002: NaN — NaN silently at end
