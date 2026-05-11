"""
Error Class 4: Schema Evolution Through Pipelines

After dropping columns, groupby/agg, or selecting subsets, Python
has no compile-time knowledge of which columns remain. References
to removed columns fail only at runtime.
"""
import pandas as pd

encounters = pd.read_csv("fixtures/encounters.csv")

# ── ERROR 4a: Accessing dropped column ──────────────────────────────────
# RUNTIME: KeyError — only when this line runs
slim = encounters[["encounter_id", "patient_id", "department"]]
try:
    slim["attending_physician"]  # KeyError at runtime
except KeyError:
    print("KeyError: column was dropped but Python doesn't know until runtime")

# ── ERROR 4b: Accessing original columns after groupby/agg ─────────────
# RUNTIME: KeyError — the aggregated DataFrame only has the group key
# and the aggregated column, but pandas doesn't track this.
summary = encounters.groupby("department").size().reset_index(name="count")
try:
    filtered = summary[summary["encounter_type"] == "Inpatient"]
except KeyError:
    print("KeyError: 'encounter_type' gone after groupby — runtime only")

# ── ERROR 4c: Chaining after drop ──────────────────────────────────────
# RUNTIME: KeyError when trying to sort by a dropped column
no_physician = encounters.drop(columns=["attending_physician"])
try:
    sorted_df = no_physician.sort_values("attending_physician")
except KeyError:
    print("KeyError: 'attending_physician' was dropped — runtime only")
