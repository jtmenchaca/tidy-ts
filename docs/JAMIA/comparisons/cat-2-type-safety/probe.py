"""Probe: Category 2 — Type Safety Errors in Python/pandas

Consolidates error classes 02, 10, 16, 22, 25, 30, 34.
"""
import json
import pandas as pd
import numpy as np
import warnings
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))
results = []

# ── Shared data ──────────────────────────────────────────────────────────────

labs = pd.read_csv("../fixtures/lab_results.csv")

# ═══════════════════════════════════════════════════════════════════════════════
# Type mismatch errors
# ═══════════════════════════════════════════════════════════════════════════════

# a: arithmetic on string column
try:
    labs["adjusted"] = labs["test_name"] + 10
    results.append({"outcome": "silent", "message": "no error", "result": str(labs["adjusted"].iloc[0])})
except TypeError as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# b: numeric aggregation on string column
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    try:
        avg = labs.groupby("test_name")["test_name"].mean()
        if w:
            results.append({"outcome": "warning", "message": str(w[0].message), "result": None})
        else:
            has_nan = avg.isna().any()
            results.append({"outcome": "silent", "message": f"returned NaN: {has_nan}", "result": None})
    except TypeError as e:
        results.append({"outcome": "error", "message": str(e), "result": None})

# c: comparing number to string literal
try:
    filtered = labs[labs["result_value"] == "high"]
    results.append({"outcome": "silent", "message": f"rows returned: {len(filtered)} (expected 0, no error)", "result": "returned 0 rows, no error"})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# ═══════════════════════════════════════════════════════════════════════════════
# Type conversion and narrowing
# ═══════════════════════════════════════════════════════════════════════════════

conv_labs = pd.DataFrame({
    "lab_id": ["L1", "L2", "L3"],
    "test_name": ["BNP", "pH", "WBC"],
    "result_str": ["1250", "7.28", "pending"],
})

# d: unparseable string silently becomes NaN
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    try:
        conv_labs["result_num"] = pd.to_numeric(conv_labs["result_str"], errors="coerce")
        nan_count = int(conv_labs["result_num"].isna().sum())
        if w:
            results.append({"outcome": "warning", "message": str(w[0].message), "result": f"{nan_count} value coerced to NaN"})
        else:
            results.append({"outcome": "silent", "message": f"unparseable became NaN silently (count={nan_count})", "result": f"{nan_count} value coerced to NaN"})
    except Exception as e:
        results.append({"outcome": "error", "message": str(e), "result": None})

# e: arithmetic on NaN propagates silently
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    try:
        conv_labs["doubled"] = conv_labs["result_num"] * 2
        nan_count = int(conv_labs["doubled"].isna().sum())
        if w:
            results.append({"outcome": "warning", "message": str(w[0].message), "result": f"NaN propagated, {nan_count} NaN"})
        else:
            results.append({"outcome": "silent", "message": f"NaN propagated in arithmetic (count={nan_count})", "result": f"NaN propagated, {nan_count} NaN"})
    except Exception as e:
        results.append({"outcome": "error", "message": str(e), "result": None})

# f: mean after conversion silently skips NaN
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    try:
        avg = conv_labs["result_num"].mean()
        if w:
            results.append({"outcome": "warning", "message": str(w[0].message), "result": "mean skipped NaN silently"})
        else:
            results.append({"outcome": "silent", "message": f"mean={avg}, skipped NaN silently", "result": "mean skipped NaN silently"})
    except Exception as e:
        results.append({"outcome": "error", "message": str(e), "result": None})

# ═══════════════════════════════════════════════════════════════════════════════
# Mixed return types
# ═══════════════════════════════════════════════════════════════════════════════

mixed_labs = pd.DataFrame({
    "patient_id": ["P001", "P002", "P003"],
    "test_name": ["BNP", "WBC", "Glucose"],
    "result_value": [1250, 15.2, 210],
})

# g: arithmetic on mixed-type column
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    def classify(row):
        if row["result_value"] > 100:
            return "HIGH"
        return row["result_value"]
    mixed_labs["status"] = mixed_labs.apply(classify, axis=1)
    try:
        mixed_labs["doubled"] = mixed_labs["status"] * 2
        has_repeated = any(isinstance(v, str) and len(v) > 4 for v in mixed_labs["doubled"])
        if w:
            results.append({"outcome": "warning", "message": str(w[0].message), "result": "string repeated, not math"})
        elif has_repeated:
            results.append({"outcome": "silent", "message": "string * 2 repeated string silently", "result": "string repeated, not math"})
        else:
            results.append({"outcome": "silent", "message": "coerced silently", "result": "coerced to object dtype"})
    except Exception as e:
        results.append({"outcome": "error", "message": str(e), "result": None})

# ═══════════════════════════════════════════════════════════════════════════════
# Temporal type safety
# ═══════════════════════════════════════════════════════════════════════════════

# h: invalid date string silently becomes NaT
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    dates = pd.to_datetime(["2024-01-15", "not-a-date", "2024-02-20"], errors="coerce")
    nat_count = int(pd.isna(dates).sum())
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": f"{nat_count} NaT values"})
    else:
        results.append({"outcome": "silent", "message": f"invalid date silently became NaT ({nat_count} NaT values)", "result": "Invalid date became NaT"})

df_dates = pd.DataFrame({
    "patient_id": ["P001", "P002"],
    "admit_date": pd.to_datetime(["2024-01-15", "2024-02-20"]),
    "los_days": [3, 7],
})

# i: date compared to number
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    try:
        filtered = df_dates[df_dates["admit_date"] > 100]
        nrows = len(filtered)
        if w:
            results.append({"outcome": "warning", "message": str(w[0].message), "result": f"{nrows} rows"})
        else:
            results.append({"outcome": "silent", "message": f"date > 100 returned {nrows} rows", "result": f"{nrows} rows (date > 100)"})
    except Exception as e:
        results.append({"outcome": "error", "message": str(e), "result": None})

# j: date + number arithmetic
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    try:
        df_dates["shifted"] = df_dates["admit_date"] + 7
        if w:
            results.append({"outcome": "warning", "message": str(w[0].message), "result": "added with warning"})
        else:
            results.append({"outcome": "silent", "message": "date + 7 silently added days", "result": "added 7 days silently"})
    except Exception as e:
        results.append({"outcome": "error", "message": str(e), "result": None})

# ═══════════════════════════════════════════════════════════════════════════════
# Column type constraint
# ═══════════════════════════════════════════════════════════════════════════════

patients = pd.DataFrame({
    "name": ["Alice", "Bob"],
    "age": [30, 45],
    "weight": [65.5, 80.0],
    "insurance": ["Medicare", "Medicaid"],
})

# k: numeric operation applied to string column
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    result = patients[["age", "insurance"]].apply(lambda x: x * 2)
    ins_val = result["insurance"].iloc[0]
    is_repeated = ins_val == "MedicareMedicare"
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": "String repeated, not doubled"})
    else:
        results.append({"outcome": "silent", "message": f"* 2 on string column repeated string: {is_repeated}", "result": "String repeated, not doubled"})

# ═══════════════════════════════════════════════════════════════════════════════
# Row label / transpose type safety
# ═══════════════════════════════════════════════════════════════════════════════

vitals = pd.DataFrame({
    "metric": ["systolic", "diastolic"],
    "P001": [120, 80],
    "P002": [145, 92],
})

transposed = vitals.T
transposed.columns = ["row_0", "row_1"]

# l: arithmetic on transposed mixed-type column
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    doubled = transposed["row_0"] * 2
    vals = doubled.tolist()
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": None})
    else:
        results.append({"outcome": "silent", "message": f"string * 2 = {vals[0]}", "result": f"str*2={repr(vals[0])}"})

# m: pre-transpose column name after transpose
try:
    _ = transposed["P001"]
    results.append({"outcome": "silent", "message": "accessed pre-transpose col", "result": None})
except KeyError as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# ═══════════════════════════════════════════════════════════════════════════════
# Enum validation
# ═══════════════════════════════════════════════════════════════════════════════

encounters = pd.DataFrame({
    "patient_id": ["P001", "P002"],
    "status": pd.Categorical(["admitted", "discharged"],
                              categories=["admitted", "discharged", "transferred"]),
})

# n: filter on invalid enum value
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    filtered = encounters[encounters["status"] == "unknown"]
    nrows = len(filtered)
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": f"{nrows} rows (silent empty)"})
    else:
        results.append({"outcome": "silent", "message": f"filter on 'unknown' returned {nrows} rows", "result": f"{nrows} rows (silent empty)"})

print(json.dumps(results))
