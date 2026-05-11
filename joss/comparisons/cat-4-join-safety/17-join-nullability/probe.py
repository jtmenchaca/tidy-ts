"""Probe: Join Nullability in Python/pandas"""
import json
import pandas as pd
import warnings
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))

results = []

patients = pd.DataFrame({
    "patient_id": ["P001", "P002", "P003"],
    "name": ["Alice Johnson", "Bob Smith", "Carol Davis"],
})

encounters = pd.DataFrame({
    "patient_id": ["P001", "P001"],
    "department": ["Emergency", "ICU"],
    "los_days": [3, 7],
})

joined = patients.merge(encounters, on="patient_id", how="left")

# 17a: String method on NaN from left join — silent NaN propagation
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    joined["dept_upper"] = joined["department"].str.upper()
    nan_count = int(joined["dept_upper"].isna().sum())
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": nan_count})
    else:
        results.append({"outcome": "silent", "message": f"str.upper() on NaN from join produced {nan_count} NaN silently", "result": f"produced {nan_count} NaN silently"})

# 17b: Arithmetic on NaN from left join — silent NaN propagation
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    joined["los_weeks"] = joined["los_days"] / 7
    nan_count = int(joined["los_weeks"].isna().sum())
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": nan_count})
    else:
        results.append({"outcome": "silent", "message": f"arithmetic on NaN from join produced {nan_count} NaN silently", "result": f"produced {nan_count} NaN silently"})

# 17c: Comparison silently excludes NaN rows
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    long_stays = joined[joined["los_days"] > 5]
    excluded = len(joined) - len(long_stays)
    # P001-ICU (los=7) matches, P001-Emergency (los=3) doesn't, P002 and P003 NaN excluded
    nan_rows = int(joined["los_days"].isna().sum())
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": nan_rows})
    else:
        results.append({"outcome": "silent", "message": f"comparison silently excluded {nan_rows} NaN rows from join", "result": f"excluded {nan_rows} NaN rows"})

print(json.dumps(results))
