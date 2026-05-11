"""
Error Class 7: Pipeline Composition Errors

In Python, multi-step pandas pipelines have no compile-time schema tracking.
Column names are strings — typos, references to renamed columns, and
post-aggregation column access all fail only at runtime.
"""
import pandas as pd

patients = pd.read_csv("fixtures/patients.csv")
encounters = pd.read_csv("fixtures/encounters.csv")
labs = pd.read_csv("fixtures/lab_results.csv")
meds = pd.read_csv("fixtures/medications.csv")

# ── ERROR 7a: Wrong column after rename ─────────────────────────────────
# RUNTIME: KeyError — 'department' was renamed to 'dept'
pipeline = encounters.rename(columns={"department": "dept"})
try:
    pipeline = pipeline[pipeline["department"] == "ICU"]
except KeyError:
    print("KeyError: 'department' was renamed — runtime only")

# ── ERROR 7b: Wrong column after multi-step transformation ──────────────
# RUNTIME: KeyError — after groupby/agg, original columns are gone
pipeline = (
    encounters
    .merge(labs, on=["encounter_id", "patient_id"])
    [["patient_id", "department", "test_name", "result_value"]]
    .groupby("patient_id")
    .agg(max_lab=("result_value", "max"))
    .reset_index()
)
try:
    pipeline["dept"] = pipeline["department"]  # KeyError
except KeyError:
    print("KeyError: 'department' gone after groupby — runtime only")

# ── CORRECT (but unchecked) pipeline ────────────────────────────────────
# This works, but no tool validates column names until execution.
# A typo anywhere in this chain fails silently or with a runtime error.
report = (
    encounters
    .merge(labs, on=["encounter_id", "patient_id"])
    .query("abnormal_flag == 'H'")
    .groupby("patient_id")
    .agg(
        abnormal_count=("lab_id", "count"),
        max_result=("result_value", "max"),
        tests=("test_name", lambda x: ", ".join(x.unique()))
    )
    .reset_index()
    .merge(patients, on="patient_id")
    .assign(full_name=lambda df: df["last_name"] + ", " + df["first_name"])
    [["full_name", "insurance_type", "abnormal_count", "max_result", "tests"]]
    .sort_values("abnormal_count", ascending=False)
)
print(report)
