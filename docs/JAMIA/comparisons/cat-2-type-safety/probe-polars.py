"""Probe: Category 2 — Type Safety Errors in Python/Polars

Consolidates error classes 02, 10, 16, 22, 25, 30, 34.
Each case mirrors the pandas probe (probe.py) to enable direct comparison.
"""
import json
import polars as pl
import warnings
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))
results = []

# ── Shared data ──────────────────────────────────────────────────────────────

labs = pl.read_csv("../fixtures/lab_results.csv")

# ═══════════════════════════════════════════════════════════════════════════════
# Type mismatch errors
# ═══════════════════════════════════════════════════════════════════════════════

# a: arithmetic on string column
try:
    out = labs.with_columns((pl.col("test_name") + 10).alias("adjusted"))
    results.append({"outcome": "silent", "message": "no error", "result": str(out["adjusted"][0])})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# b: numeric aggregation on string column
try:
    avg = labs.group_by("test_name").agg(pl.col("test_name").mean().alias("avg"))
    results.append({"outcome": "silent", "message": "aggregation succeeded", "result": None})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# c: comparing number to string literal
try:
    filtered = labs.filter(pl.col("result_value") == "high")
    nrows = filtered.height
    results.append({"outcome": "silent", "message": f"rows returned: {nrows}", "result": f"returned {nrows} rows, no error"})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# ═══════════════════════════════════════════════════════════════════════════════
# Type conversion and narrowing
# ═══════════════════════════════════════════════════════════════════════════════

conv_labs = pl.DataFrame({
    "lab_id": ["L1", "L2", "L3"],
    "test_name": ["BNP", "pH", "WBC"],
    "result_str": ["1250", "7.28", "pending"],
})

# d: unparseable string — Polars strict cast fails, lenient returns null
try:
    with_num = conv_labs.with_columns(pl.col("result_str").cast(pl.Float64, strict=False).alias("result_num"))
    null_count = with_num["result_num"].null_count()
    results.append({"outcome": "silent", "message": f"unparseable became null silently (count={null_count})", "result": f"{null_count} value coerced to null"})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# e: arithmetic on null propagates silently
try:
    with_num = conv_labs.with_columns(pl.col("result_str").cast(pl.Float64, strict=False).alias("result_num"))
    doubled = with_num.with_columns((pl.col("result_num") * 2).alias("doubled"))
    null_count = doubled["doubled"].null_count()
    results.append({"outcome": "silent", "message": f"null propagated in arithmetic (count={null_count})", "result": f"null propagated, {null_count} null"})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# f: mean after conversion silently skips null
try:
    with_num = conv_labs.with_columns(pl.col("result_str").cast(pl.Float64, strict=False).alias("result_num"))
    avg = with_num["result_num"].mean()
    results.append({"outcome": "silent", "message": f"mean={avg}, skipped null silently", "result": "mean skipped null silently"})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# ═══════════════════════════════════════════════════════════════════════════════
# Mixed return types
# ═══════════════════════════════════════════════════════════════════════════════

mixed_labs = pl.DataFrame({
    "patient_id": ["P001", "P002", "P003"],
    "test_name": ["BNP", "WBC", "Glucose"],
    "result_value": [1250.0, 15.2, 210.0],
})

# g: arithmetic on mixed-type column
try:
    with_status = mixed_labs.with_columns(
        pl.when(pl.col("result_value") > 100)
        .then(pl.lit("HIGH"))
        .otherwise(pl.col("result_value").cast(pl.Utf8))
        .alias("status")
    )
    # status is now Utf8; * 2 on string column
    doubled = with_status.with_columns((pl.col("status") + pl.col("status")).alias("doubled"))
    val = doubled["doubled"][0]
    is_repeated = isinstance(val, str) and val == "HIGHHIGH"
    results.append({"outcome": "silent", "message": f"string concatenated: {is_repeated}", "result": "string repeated, not math"})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# ═══════════════════════════════════════════════════════════════════════════════
# Temporal type safety
# ═══════════════════════════════════════════════════════════════════════════════

# h: invalid date string
try:
    dates = pl.Series(["2024-01-15", "not-a-date", "2024-02-20"]).str.to_date(strict=False)
    null_count = dates.null_count()
    results.append({"outcome": "silent", "message": f"invalid date became null ({null_count} null values)", "result": "Invalid date became null"})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

df_dates = pl.DataFrame({
    "patient_id": ["P001", "P002"],
    "admit_date": [pl.date(2024, 1, 15), pl.date(2024, 2, 20)],
    "los_days": [3, 7],
})

# i: date compared to number
try:
    filtered = df_dates.filter(pl.col("admit_date") > 100)
    nrows = filtered.height
    results.append({"outcome": "silent", "message": f"date > 100 returned {nrows} rows", "result": f"{nrows} rows (date > 100)"})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# j: date + number arithmetic
try:
    shifted = df_dates.with_columns((pl.col("admit_date") + 7).alias("shifted"))
    val = shifted["shifted"][0]
    results.append({"outcome": "silent", "message": f"date + 7 = {val}", "result": f"date+7={val}"})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# ═══════════════════════════════════════════════════════════════════════════════
# Column type constraint
# ═══════════════════════════════════════════════════════════════════════════════

patients = pl.DataFrame({
    "name": ["Alice", "Bob"],
    "age": [30, 45],
    "weight": [65.5, 80.0],
    "insurance": ["Medicare", "Medicaid"],
})

# k: numeric operation applied to string column
try:
    result = patients.select(
        (pl.col("age") * 2).alias("age"),
        (pl.col("insurance") * 2).alias("insurance"),
    )
    results.append({"outcome": "silent", "message": "string * 2 succeeded", "result": "String repeated, not doubled"})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# ═══════════════════════════════════════════════════════════════════════════════
# Row label / transpose type safety
# ═══════════════════════════════════════════════════════════════════════════════

vitals = pl.DataFrame({
    "metric": ["systolic", "diastolic"],
    "P001": [120, 80],
    "P002": [145, 92],
})

# l: arithmetic on transposed mixed-type column
try:
    transposed = vitals.transpose(include_header=True, header_name="patient", column_names="metric")
    # After transpose, columns are systolic and diastolic, rows are P001, P002
    # But the patient column is a string — try multiplying all columns
    doubled = transposed.with_columns(pl.col("systolic") * 2)
    results.append({"outcome": "silent", "message": "transposed col * 2 succeeded", "result": "transposed arithmetic succeeded"})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# m: pre-transpose column name after transpose
try:
    _ = transposed["P001"]
    results.append({"outcome": "silent", "message": "accessed pre-transpose col", "result": None})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# ═══════════════════════════════════════════════════════════════════════════════
# Enum validation
# ═══════════════════════════════════════════════════════════════════════════════

encounters = pl.DataFrame({
    "patient_id": ["P001", "P002"],
    "status": pl.Series(["admitted", "discharged"]).cast(pl.Enum(["admitted", "discharged", "transferred"])),
})

# n: filter on invalid enum value
try:
    filtered = encounters.filter(pl.col("status") == "unknown")
    nrows = filtered.height
    results.append({"outcome": "silent", "message": f"filter on 'unknown' returned {nrows} rows", "result": f"{nrows} rows (silent empty)"})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

print(json.dumps(results))
