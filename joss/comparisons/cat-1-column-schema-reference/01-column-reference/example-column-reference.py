"""
Error Class 1: Column Reference Errors

Scenario: Referencing a misspelled or nonexistent column name
in mutate, filter, or sort operations.
"""
import pandas as pd

patients = pd.read_csv("fixtures/patients.csv")
labs = pd.read_csv("fixtures/lab_results.csv")

# ── ERROR 1a: Misspelled column name ──────────────────────────────────────
# 'patientId' does not exist; column is 'patient_id'
patients["full_name"] = patients["patientId"] + " " + patients["last_name"]

# ── ERROR 1b: Nonexistent column in filter ────────────────────────────────
# 'diagnosis' is not a column in the patients table
filtered = patients[patients["diagnosis"] == "I50.9"]

# ── ERROR 1c: Misspelled column in sort ───────────────────────────────────
# 'result_values' does not exist; column is 'result_value'
sorted_labs = labs.sort_values("result_values", ascending=False)
