"""Probe: Category 1 — Column & Schema Reference Errors in Python/pandas

Consolidates error classes 01, 04, 07, 14, 15, 28, 36.
"""
import json
import pandas as pd
import warnings
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))
results = []

# ── Shared data ──────────────────────────────────────────────────────────────

patients = pd.read_csv("../fixtures/patients.csv")
labs = pd.read_csv("../fixtures/lab_results.csv")
encounters = pd.read_csv("../fixtures/encounters.csv")

# ═══════════════════════════════════════════════════════════════════════════════
# Column reference errors
# ═══════════════════════════════════════════════════════════════════════════════

# 1a: Misspelled column in mutate-like operation
try:
    patients["full_name"] = patients["patientId"] + " " + patients["last_name"]
    results.append({"outcome": "silent", "message": "no error", "result": None})
except KeyError as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# 1b: Nonexistent column in filter
try:
    filtered = patients[patients["diagnosis"] == "I50.9"]
    results.append({"outcome": "silent", "message": "no error", "result": None})
except KeyError as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# 1c: Misspelled column in sort
try:
    sorted_labs = labs.sort_values("result_values", ascending=False)
    results.append({"outcome": "silent", "message": "no error", "result": None})
except KeyError as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# ═══════════════════════════════════════════════════════════════════════════════
# Schema evolution through pipelines
# ═══════════════════════════════════════════════════════════════════════════════

# 4a: Accessing dropped column
try:
    slim = encounters[["encounter_id", "patient_id", "department"]]
    val = slim["attending_physician"]
    results.append({"outcome": "silent", "message": "accessed without error", "result": None})
except KeyError as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# 4b: Accessing original columns after groupby/agg
try:
    summary = encounters.groupby("department").size().reset_index(name="count")
    filtered = summary[summary["encounter_type"] == "Inpatient"]
    results.append({"outcome": "silent", "message": "filtered without error", "result": len(filtered)})
except KeyError as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# 4c: Sorting by dropped column
try:
    no_physician = encounters.drop(columns=["attending_physician"])
    sorted_df = no_physician.sort_values("attending_physician")
    results.append({"outcome": "silent", "message": "sorted without error", "result": None})
except KeyError as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# ═══════════════════════════════════════════════════════════════════════════════
# Pipeline composition errors
# ═══════════════════════════════════════════════════════════════════════════════

# 7a: Using old column name after rename
try:
    pipeline = encounters.rename(columns={"department": "dept"})
    pipeline = pipeline[pipeline["department"] == "ICU"]
    results.append({"outcome": "silent", "message": "filtered without error", "result": len(pipeline)})
except KeyError as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# 7b: Accessing column removed by groupby/agg
try:
    pipeline = (
        encounters
        .merge(labs, on=["encounter_id", "patient_id"])
        [["patient_id", "department", "test_name", "result_value"]]
        .groupby("patient_id")
        .agg(max_lab=("result_value", "max"))
        .reset_index()
    )
    pipeline["dept"] = pipeline["department"]
    results.append({"outcome": "silent", "message": "accessed without error", "result": None})
except KeyError as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# ═══════════════════════════════════════════════════════════════════════════════
# Pivot type safety
# ═══════════════════════════════════════════════════════════════════════════════

vitals = pd.DataFrame({
    "patient_id": ["P001", "P001", "P002", "P002"],
    "metric": ["systolic", "diastolic", "systolic", "diastolic"],
    "value": [130, 85, 145, 92],
})

wide = vitals.pivot(index="patient_id", columns="metric", values="value").reset_index()
wide.columns.name = None

# 14a: Accessing non-existent pivot column
try:
    val = wide["temperature"]
    results.append({"outcome": "silent", "message": "accessed without error", "result": None})
except KeyError as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# 14b: Pre-pivot column gone
try:
    val = wide["metric"]
    results.append({"outcome": "silent", "message": "accessed without error", "result": None})
except KeyError as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# ═══════════════════════════════════════════════════════════════════════════════
# Distinct column narrowing
# ═══════════════════════════════════════════════════════════════════════════════

enc_distinct = pd.DataFrame({
    "patient_id": ["P001", "P001", "P002", "P002"],
    "department": ["Cardiology", "Cardiology", "Emergency", "Primary Care"],
    "encounter_type": ["Outpatient", "Inpatient", "ED", "Outpatient"],
    "physician": ["Dr. Patel", "Dr. Patel", "Dr. Lee", "Dr. Martinez"],
})

# 15a: drop_duplicates keeps all columns — no schema narrowing
try:
    unique = enc_distinct.drop_duplicates(subset=["patient_id", "department"])
    has_physician = "physician" in unique.columns
    results.append({"outcome": "silent", "message": f"physician column still present: {has_physician} — arbitrary values kept, no warning", "result": "all columns kept silently"})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# 15b: drop_duplicates with keep='first' keeps all columns — silent
try:
    unique2 = enc_distinct.drop_duplicates(subset=["patient_id", "department"], keep="first")
    has_physician = "physician" in unique2.columns
    results.append({"outcome": "silent", "message": f"physician column present: {has_physician}", "result": "all columns kept silently"})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# ═══════════════════════════════════════════════════════════════════════════════
# Reorder vs select schema preservation
# ═══════════════════════════════════════════════════════════════════════════════

patients_28 = pd.DataFrame({
    "patient_id": ["P001"],
    "name": ["Alice"],
    "age": [30],
    "insurance": ["Medicare"],
})

# 28a: df[['col1', 'col2']] silently drops other columns
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    selected = patients_28[["name", "patient_id"]]
    cols_lost = len(patients_28.columns) - len(selected.columns)
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": "Silently dropped 2 columns"})
    else:
        results.append({"outcome": "silent", "message": f"column selection silently dropped {cols_lost} columns", "result": "Silently dropped 2 columns"})

# ═══════════════════════════════════════════════════════════════════════════════
# Column existence error messages
# ═══════════════════════════════════════════════════════════════════════════════

patients_36 = pd.DataFrame({
    "patient_id": ["P001"],
    "name": ["Alice"],
    "department": ["ED"],
})

# 36a: groupby with wrong column — error message quality
try:
    patients_36.groupby("dept")
    results.append({"outcome": "silent", "message": "groupby succeeded", "result": None})
except KeyError as e:
    msg = str(e)
    results.append({"outcome": "error", "message": msg, "result": None})

# 36b: Column access error message quality
try:
    _ = patients_36["dept"]
    results.append({"outcome": "silent", "message": "access succeeded", "result": None})
except KeyError as e:
    msg = str(e)
    results.append({"outcome": "error", "message": msg, "result": None})

print(json.dumps(results))
