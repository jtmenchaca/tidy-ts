"""
Error Class 5: Null Safety Errors

Python/pandas uses NaN for missing values. NaN propagates silently through
arithmetic and comparisons, producing incorrect results without warning.
"""
import pandas as pd
import numpy as np

encounters = pd.read_csv("fixtures/encounters.csv")
labs = pd.read_csv("fixtures/lab_results.csv")

# ── ERROR 5a: Arithmetic on column with NaN — silent propagation ────────
# discharge_date has NaN for ED visits (no discharge).
# String operations on NaN propagate silently — no error.
encounters["los_label"] = encounters["discharge_date"].str.slice(0, 10)
print(encounters[["encounter_id", "los_label"]])
# NaN rows silently become NaN — no warning that data is missing

# ── ERROR 5b: NaN propagation in arithmetic ─────────────────────────────
# reference_high has NaN for some labs (e.g., pH has no unit).
# Subtraction with NaN → NaN, silently.
labs["deviation"] = labs["result_value"] - labs["reference_high"]
print(labs[["test_name", "result_value", "reference_high", "deviation"]])
# Rows with NaN reference_high get NaN deviation — no error raised.
# In a large pipeline this is easy to miss.

# ── ERROR 5c: NaN in boolean comparisons ────────────────────────────────
# NaN comparisons return False — filtering silently drops NaN rows
critical = labs[labs["reference_high"] > 100]
# Rows where reference_high is NaN are silently excluded.
# No indication that data was lost.
print(f"Critical labs: {len(critical)} (some may be silently excluded)")

# ── ERROR 5d: Aggregation ignoring NaN without warning ──────────────────
# pandas .mean() silently skips NaN values by default
avg_ref = labs["reference_high"].mean()
print(f"Average reference_high: {avg_ref}")
# This average excludes NaN rows without any indication
