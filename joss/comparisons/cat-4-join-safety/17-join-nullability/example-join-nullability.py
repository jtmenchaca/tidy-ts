"""
Error Class 17: Join Nullability

After a left merge, unmatched rows get NaN for right-side columns.
Python silently lets you operate on these NaN values — arithmetic
propagates NaN, string methods produce NaN, and comparisons exclude
NaN rows without any warning.
"""
import pandas as pd

patients = pd.DataFrame({
    "patient_id": ["P001", "P002", "P003"],
    "name": ["Alice Johnson", "Bob Smith", "Carol Davis"],
})

encounters = pd.DataFrame({
    "patient_id": ["P001", "P001"],
    "department": ["Emergency", "ICU"],
    "los_days": [3, 7],
})

# Left merge — P002 and P003 have NaN for department and los_days
joined = patients.merge(encounters, on="patient_id", how="left")

# SILENT: .str.upper() on NaN produces NaN — no error, no warning
joined["dept_upper"] = joined["department"].str.upper()
print(joined[["patient_id", "department", "dept_upper"]])
# P002: NaN → NaN, P003: NaN → NaN

# SILENT: Arithmetic on NaN propagates — no error, no warning
joined["los_weeks"] = joined["los_days"] / 7
print(joined[["patient_id", "los_days", "los_weeks"]])
# P002: NaN → NaN, P003: NaN → NaN

# SILENT: Comparison excludes NaN rows — no error, no warning
long_stays = joined[joined["los_days"] > 5]
print(f"Rows with los > 5: {len(long_stays)}")
# NaN rows silently excluded from result
