"""
Error Class 3: Join Key Errors

Python/pandas join errors are only caught at runtime. Misspelled keys
produce exceptions, but some mismatches produce silently wrong results
(e.g., joining on mismatched types creates an empty join).
"""
import pandas as pd

patients = pd.read_csv("fixtures/patients.csv")
encounters = pd.read_csv("fixtures/encounters.csv")
labs = pd.read_csv("fixtures/lab_results.csv")

# ── ERROR 3a: Join key doesn't exist in one table ───────────────────────
# RUNTIME: KeyError — only caught when this merge executes
merged = patients.merge(labs, on="encounter_id")
# KeyError: 'encounter_id' — patients has no encounter_id column

# ── ERROR 3b: Misspelled join key ───────────────────────────────────────
# RUNTIME: KeyError — case-sensitive mismatch
merged = patients.merge(encounters, on="patient_ID")
# KeyError: 'patient_ID'

# ── ERROR 3c: Using columns from wrong table post-join ──────────────────
# SILENT: After joining patients + encounters, you might reference
# a column from the medications table by mistake. Python doesn't
# track provenance — you only find out at runtime.
joined = patients.merge(encounters, on="patient_id")
try:
    result = joined["prescription_id"]  # KeyError at runtime
except KeyError:
    print("KeyError: 'prescription_id' — only discovered at runtime")
