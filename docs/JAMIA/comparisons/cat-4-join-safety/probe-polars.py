"""Probe: Category 4 — Join Safety Errors in Python/Polars

Consolidates error classes 03, 17, 18.
Each case mirrors the pandas probe (probe.py) to enable direct comparison.
"""
import json
import polars as pl
import warnings
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))
results = []

# ── Shared data ──────────────────────────────────────────────────────────────

patients = pl.read_csv("../fixtures/patients.csv")
encounters = pl.read_csv("../fixtures/encounters.csv")
labs = pl.read_csv("../fixtures/lab_results.csv")

# ═══════════════════════════════════════════════════════════════════════════════
# Join key errors
# ═══════════════════════════════════════════════════════════════════════════════

# a: join on key not in left table
try:
    merged = patients.join(labs, on="encounter_id")
    results.append({"outcome": "silent", "message": "merged without error", "result": merged.height})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# b: join on misspelled key
try:
    merged = patients.join(encounters, on="patient_ID")
    results.append({"outcome": "silent", "message": "merged without error", "result": merged.height})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# c: access missing column post-join
try:
    joined = patients.join(encounters, on="patient_id")
    val = joined["prescription_id"]
    results.append({"outcome": "silent", "message": "accessed without error", "result": None})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# ═══════════════════════════════════════════════════════════════════════════════
# Join nullability
# ═══════════════════════════════════════════════════════════════════════════════

patients_17 = pl.DataFrame({
    "patient_id": ["P001", "P002", "P003"],
    "name": ["Alice Johnson", "Bob Smith", "Carol Davis"],
})

encounters_17 = pl.DataFrame({
    "patient_id": ["P001", "P001"],
    "department": ["Emergency", "ICU"],
    "los_days": [3, 7],
})

joined = patients_17.join(encounters_17, on="patient_id", how="left")

# d: string method on null from left join
try:
    with_upper = joined.with_columns(pl.col("department").str.to_uppercase().alias("dept_upper"))
    null_count = with_upper["dept_upper"].null_count()
    results.append({"outcome": "silent", "message": f"str.to_uppercase() on null from join produced {null_count} null silently", "result": f"produced {null_count} null silently"})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# e: arithmetic on null from left join
try:
    with_weeks = joined.with_columns((pl.col("los_days") / 7).alias("los_weeks"))
    null_count = with_weeks["los_weeks"].null_count()
    results.append({"outcome": "silent", "message": f"arithmetic on null from join produced {null_count} null silently", "result": f"produced {null_count} null silently"})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# f: comparison silently excludes null rows
try:
    long_stays = joined.filter(pl.col("los_days") > 5)
    null_rows = joined["los_days"].null_count()
    results.append({"outcome": "silent", "message": f"comparison silently excluded {null_rows} null rows from join", "result": f"excluded {null_rows} null rows"})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# ═══════════════════════════════════════════════════════════════════════════════
# Column name collision
# ═══════════════════════════════════════════════════════════════════════════════

admissions = pl.DataFrame({
    "patient_id": ["P001", "P002"],
    "date": ["2024-01-15", "2024-02-20"],
    "department": ["ED", "ICU"],
})

discharges = pl.DataFrame({
    "patient_id": ["P001", "P002"],
    "date": ["2024-01-18", "2024-02-25"],
    "disposition": ["Home", "SNF"],
})

# g: explicit suffix -- access original "date" column name (should error)
try:
    joined_18 = admissions.join(discharges, on="patient_id", suffix="_discharge")
    _ = joined_18["date"]
    results.append({"outcome": "silent", "message": "accessed 'date'", "result": None})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# h: no suffix -- access "date" column (Polars adds "_right" by default)
try:
    joined_18 = admissions.join(discharges, on="patient_id")
    _ = joined_18["date"]
    results.append({"outcome": "silent", "message": "accessed 'date'", "result": None})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

print(json.dumps(results))
