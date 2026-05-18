"""Probe: Category 4 -- Join Safety Errors in Python/pandas

Consolidates error classes 03, 17, 18.
"""
import json
import pandas as pd
import warnings
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))
results = []

# ── Shared data ──────────────────────────────────────────────────────────────

patients = pd.read_csv("../../fixtures/patients.csv")
encounters = pd.read_csv("../../fixtures/encounters.csv")
labs = pd.read_csv("../../fixtures/lab_results.csv")

# ═══════════════════════════════════════════════════════════════════════════════
# Join key errors
# ═══════════════════════════════════════════════════════════════════════════════

# a: join on key not in left table
try:
    merged = patients.merge(labs, on="encounter_id")
    results.append({"outcome": "silent", "message": "merged without error", "result": len(merged)})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# b: join on misspelled key
try:
    merged = patients.merge(encounters, on="patient_ID")
    results.append({"outcome": "silent", "message": "merged without error", "result": len(merged)})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# c: access missing column post-join
try:
    joined = patients.merge(encounters, on="patient_id")
    val = joined["prescription_id"]
    results.append({"outcome": "silent", "message": "accessed without error", "result": None})
except KeyError as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# ═══════════════════════════════════════════════════════════════════════════════
# Join nullability
# ═══════════════════════════════════════════════════════════════════════════════

patients_17 = pd.DataFrame({
    "patient_id": ["P001", "P002", "P003"],
    "name": ["Alice Johnson", "Bob Smith", "Carol Davis"],
})

encounters_17 = pd.DataFrame({
    "patient_id": ["P001", "P001"],
    "department": ["Emergency", "ICU"],
    "los_days": [3, 7],
})

joined = patients_17.merge(encounters_17, on="patient_id", how="left")

# d: string method on NaN from left join
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    joined["dept_upper"] = joined["department"].str.upper()
    nan_count = int(joined["dept_upper"].isna().sum())
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": nan_count})
    else:
        results.append({"outcome": "silent", "message": f"str.upper() on NaN from join produced {nan_count} NaN silently", "result": f"produced {nan_count} NaN silently"})

# e: arithmetic on NaN from left join
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    joined["los_weeks"] = joined["los_days"] / 7
    nan_count = int(joined["los_weeks"].isna().sum())
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": nan_count})
    else:
        results.append({"outcome": "silent", "message": f"arithmetic on NaN from join produced {nan_count} NaN silently", "result": f"produced {nan_count} NaN silently"})

# f: comparison silently excludes NaN rows
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    long_stays = joined[joined["los_days"] > 5]
    nan_rows = int(joined["los_days"].isna().sum())
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": nan_rows})
    else:
        results.append({"outcome": "silent", "message": f"comparison silently excluded {nan_rows} NaN rows from join", "result": f"excluded {nan_rows} NaN rows"})

# ═══════════════════════════════════════════════════════════════════════════════
# Column name collision
# ═══════════════════════════════════════════════════════════════════════════════

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

# g: explicit suffixes -- access original name
try:
    joined_18 = admissions.merge(discharges, on="patient_id", suffixes=("_admit", "_discharge"))
    _ = joined_18["date"]
    results.append({"outcome": "silent", "message": "accessed 'date'", "result": None})
except KeyError as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# h: no suffixes -- access ambiguous original name
try:
    joined_18 = admissions.merge(discharges, on="patient_id")
    _ = joined_18["date"]
    results.append({"outcome": "silent", "message": "accessed 'date'", "result": None})
except KeyError as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

print(json.dumps(results))
