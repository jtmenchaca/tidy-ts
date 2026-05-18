"""Probe: Category 1 — Column & Schema Reference Errors in Python/Polars

Consolidates error classes 01, 04, 07, 14, 15, 28, 36.
Each case mirrors the pandas probe (probe.py) to enable direct comparison.
"""
import json
import polars as pl
import warnings
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))
results = []

# ── Shared data ──────────────────────────────────────────────────────────────

patients = pl.read_csv("../../fixtures/patients.csv")
labs = pl.read_csv("../../fixtures/lab_results.csv")
encounters = pl.read_csv("../../fixtures/encounters.csv")

# ═══════════════════════════════════════════════════════════════════════════════
# Column reference errors
# ═══════════════════════════════════════════════════════════════════════════════

# 1a: Misspelled column in expression
try:
    out = patients.with_columns((pl.col("patientId") + " " + pl.col("last_name")).alias("full_name"))
    results.append({"outcome": "silent", "message": "no error", "result": None})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# 1b: Nonexistent column in filter
try:
    filtered = patients.filter(pl.col("diagnosis") == "I50.9")
    results.append({"outcome": "silent", "message": "no error", "result": None})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# 1c: Misspelled column in sort
try:
    sorted_labs = labs.sort("result_values", descending=True)
    results.append({"outcome": "silent", "message": "no error", "result": None})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# ═══════════════════════════════════════════════════════════════════════════════
# Schema evolution through pipelines
# ═══════════════════════════════════════════════════════════════════════════════

# 4a: Accessing dropped column
try:
    slim = encounters.select("encounter_id", "patient_id", "department")
    val = slim["attending_physician"]
    results.append({"outcome": "silent", "message": "accessed without error", "result": None})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# 4b: Accessing original columns after groupby/agg
try:
    summary = encounters.group_by("department").agg(pl.len().alias("count"))
    filtered = summary.filter(pl.col("encounter_type") == "Inpatient")
    results.append({"outcome": "silent", "message": "filtered without error", "result": filtered.height})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# 4c: Sorting by dropped column
try:
    no_physician = encounters.drop("attending_physician")
    sorted_df = no_physician.sort("attending_physician")
    results.append({"outcome": "silent", "message": "sorted without error", "result": None})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# ═══════════════════════════════════════════════════════════════════════════════
# Pipeline composition errors
# ═══════════════════════════════════════════════════════════════════════════════

# 7a: Using old column name after rename
try:
    pipeline = encounters.rename({"department": "dept"})
    pipeline = pipeline.filter(pl.col("department") == "ICU")
    results.append({"outcome": "silent", "message": "filtered without error", "result": pipeline.height})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# 7b: Accessing column removed by groupby/agg
try:
    pipeline = (
        encounters
        .join(labs, on=["encounter_id", "patient_id"])
        .select("patient_id", "department", "test_name", "result_value")
        .group_by("patient_id")
        .agg(pl.col("result_value").max().alias("max_lab"))
    )
    pipeline = pipeline.with_columns(pl.col("department").alias("dept"))
    results.append({"outcome": "silent", "message": "accessed without error", "result": None})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# ═══════════════════════════════════════════════════════════════════════════════
# Pivot type safety
# ═══════════════════════════════════════════════════════════════════════════════

vitals = pl.DataFrame({
    "patient_id": ["P001", "P001", "P002", "P002"],
    "metric": ["systolic", "diastolic", "systolic", "diastolic"],
    "value": [130, 85, 145, 92],
})

wide = vitals.pivot(on="metric", index="patient_id", values="value")

# 14a: Accessing non-existent pivot column
try:
    val = wide["temperature"]
    results.append({"outcome": "silent", "message": "accessed without error", "result": None})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# 14b: Pre-pivot column gone
try:
    val = wide["metric"]
    results.append({"outcome": "silent", "message": "accessed without error", "result": None})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# ═══════════════════════════════════════════════════════════════════════════════
# Distinct column narrowing
# ═══════════════════════════════════════════════════════════════════════════════

enc_distinct = pl.DataFrame({
    "patient_id": ["P001", "P001", "P002", "P002"],
    "department": ["Cardiology", "Cardiology", "Emergency", "Primary Care"],
    "encounter_type": ["Outpatient", "Inpatient", "ED", "Outpatient"],
    "physician": ["Dr. Patel", "Dr. Patel", "Dr. Lee", "Dr. Martinez"],
})

# 15a: unique keeps all columns — no schema narrowing
try:
    unique = enc_distinct.unique(subset=["patient_id", "department"])
    has_physician = "physician" in unique.columns
    results.append({"outcome": "silent", "message": f"physician column still present: {has_physician}", "result": "all columns kept silently"})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# 15b: unique with keep='first' keeps all columns — silent
try:
    unique2 = enc_distinct.unique(subset=["patient_id", "department"], keep="first")
    has_physician = "physician" in unique2.columns
    results.append({"outcome": "silent", "message": f"physician column present: {has_physician}", "result": "all columns kept silently"})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# ═══════════════════════════════════════════════════════════════════════════════
# Reorder vs select schema preservation
# ═══════════════════════════════════════════════════════════════════════════════

patients_28 = pl.DataFrame({
    "patient_id": ["P001"],
    "name": ["Alice"],
    "age": [30],
    "insurance": ["Medicare"],
})

# 28a: select silently drops other columns
try:
    selected = patients_28.select("name", "patient_id")
    cols_lost = len(patients_28.columns) - len(selected.columns)
    results.append({"outcome": "silent", "message": f"column selection silently dropped {cols_lost} columns", "result": "Silently dropped 2 columns"})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# ═══════════════════════════════════════════════════════════════════════════════
# Column existence error messages
# ═══════════════════════════════════════════════════════════════════════════════

patients_36 = pl.DataFrame({
    "patient_id": ["P001"],
    "name": ["Alice"],
    "department": ["ED"],
})

# 36a: group_by with wrong column — error message quality
try:
    patients_36.group_by("dept").agg(pl.len())
    results.append({"outcome": "silent", "message": "groupby succeeded", "result": None})
except Exception as e:
    msg = str(e)
    results.append({"outcome": "error", "message": msg, "result": None})

# 36b: Column access error message quality
try:
    _ = patients_36["dept"]
    results.append({"outcome": "silent", "message": "access succeeded", "result": None})
except Exception as e:
    msg = str(e)
    results.append({"outcome": "error", "message": msg, "result": None})

# ═══════════════════════════════════════════════════════════════════════════════
# Residual grouping after summarize
# ═══════════════════════════════════════════════════════════════════════════════

labs_19 = pl.DataFrame({
    "patient_id": ["P001", "P001", "P002", "P002"],
    "test_name": ["BNP", "WBC", "BNP", "WBC"],
    "result_value": [1250.0, 15.2, 450.0, 8.1],
})

# p: Multi-level groupby + agg — Polars returns a flat DataFrame (no MultiIndex)
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    multi = labs_19.group_by(["patient_id", "test_name"]).agg(pl.col("result_value").mean())
    result_type = type(multi).__name__
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": result_type})
    else:
        results.append({"outcome": "silent", "message": f"group_by+agg returned flat {result_type} (no MultiIndex)", "result": f"flat {result_type}"})

print(json.dumps(results))
