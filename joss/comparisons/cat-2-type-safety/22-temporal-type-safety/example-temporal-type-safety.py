"""
Error Class 22: Temporal Type Safety

Python's pd.to_datetime silently produces NaT for invalid dates.
Date arithmetic with timedelta is allowed but pd.Timestamp + int
is silently deprecated or produces unexpected results.
"""
import pandas as pd

encounters = pd.DataFrame({
    "patient_id": ["P001", "P002", "P003"],
    "admit_date": ["2024-01-15", "2024-02-20", "not-a-date"],
    "los_days": [3, 7, 5],
})

# SILENT: Invalid date string becomes NaT
encounters["admit_date"] = pd.to_datetime(encounters["admit_date"], errors="coerce")
print(encounters["admit_date"])  # P003: NaT — no error, no warning

# SILENT: Arithmetic on NaT propagates
encounters["discharge"] = encounters["admit_date"] + pd.to_timedelta(encounters["los_days"], unit="D")
print(encounters["discharge"])  # P003: NaT — silently wrong
