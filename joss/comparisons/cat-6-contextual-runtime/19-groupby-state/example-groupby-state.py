"""
Error Class 19: GroupBy State Tracking

Python's groupby returns a GroupBy object. Calling DataFrame methods
on it either fails at runtime or silently changes behavior.
Multi-level groupby + agg silently produces a MultiIndex, which
breaks subsequent column access patterns.
"""
import pandas as pd

labs = pd.DataFrame({
    "patient_id": ["P001", "P001", "P002", "P002"],
    "test_name": ["BNP", "WBC", "BNP", "WBC"],
    "result_value": [1250, 15.2, 450, 8.1],
})

grouped = labs.groupby("patient_id")

# Runtime: merge on GroupBy object fails
# grouped.merge(...)  # AttributeError

# Runtime: direct column assignment fails
# grouped["new_col"] = ...  # TypeError

# SILENT: Multi-level groupby produces MultiIndex
multi = labs.groupby(["patient_id", "test_name"]).agg({"result_value": "mean"})
print(type(multi.index))  # MultiIndex — not a regular DataFrame
print(multi.columns.tolist())  # result_value still accessible, but index is multi-level
