"""Probe: Temporal Type Safety in Python"""
import json
import pandas as pd
import warnings
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))

results = []

# 22a: Invalid date string silently becomes NaT
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    dates = pd.to_datetime(["2024-01-15", "not-a-date", "2024-02-20"], errors="coerce")
    nat_count = int(pd.isna(dates).sum())
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": f"{nat_count} NaT values"})
    else:
        results.append({"outcome": "silent", "message": f"invalid date silently became NaT ({nat_count} NaT values)", "result": "Invalid date became NaT"})

# 22b: Compare date to number
df = pd.DataFrame({
    "patient_id": ["P001", "P002"],
    "admit_date": pd.to_datetime(["2024-01-15", "2024-02-20"]),
    "los_days": [3, 7],
})

with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    try:
        filtered = df[df["admit_date"] > 100]
        nrows = len(filtered)
        if w:
            results.append({"outcome": "warning", "message": str(w[0].message), "result": f"{nrows} rows"})
        else:
            results.append({"outcome": "silent", "message": f"date > 100 returned {nrows} rows", "result": f"{nrows} rows (date > 100)"})
    except Exception as e:
        results.append({"outcome": "error", "message": str(e), "result": None})

# 22c: Add number to date
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    try:
        df["shifted"] = df["admit_date"] + 7
        if w:
            results.append({"outcome": "warning", "message": str(w[0].message), "result": "added with warning"})
        else:
            results.append({"outcome": "silent", "message": "date + 7 silently added days", "result": "added 7 days silently"})
    except Exception as e:
        results.append({"outcome": "error", "message": str(e), "result": None})

print(json.dumps(results))
