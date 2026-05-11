"""
Error Class 18: Column Name Collision in Joins

When merging DataFrames with shared non-key column names, pandas
silently appends _x and _y suffixes. You must discover these at
runtime — there's no compile-time indication that 'date' became
'date_x' and 'date_y'.
"""
import pandas as pd

admissions = pd.DataFrame({
    "patient_id": ["P001", "P002"],
    "date": ["2024-01-15", "2024-02-20"],
    "department": ["ED", "ICU"],
})

discharges = pd.DataFrame({
    "patient_id": ["P001", "P002"],
    "date": ["2024-01-18", "2024-02-25"],
    "disposition": ["Home", "SNF"],
})

# Merge — 'date' exists in both, pandas silently renames to date_x, date_y
joined = admissions.merge(discharges, on="patient_id")
print(joined.columns.tolist())
# ['patient_id', 'date_x', 'department', 'date_y', 'disposition']

# SILENT: Accessing 'date' produces KeyError only at runtime
# joined["date"]  # KeyError: 'date'

# The suffix names are discoverable only by inspecting the result
print(joined[["date_x", "date_y"]])
