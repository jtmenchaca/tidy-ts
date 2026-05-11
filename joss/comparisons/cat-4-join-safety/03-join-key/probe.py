"""Probe: Join Key Errors in Python/pandas"""
import json
import pandas as pd
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))
results = []

patients = pd.read_csv("../fixtures/patients.csv")
encounters = pd.read_csv("../fixtures/encounters.csv")
labs = pd.read_csv("../fixtures/lab_results.csv")

# 3a: Join key doesn't exist in left table
try:
    merged = patients.merge(labs, on="encounter_id")
    results.append({"outcome": "silent", "message": "merged without error", "result": len(merged)})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# 3b: Misspelled join key (case mismatch)
try:
    merged = patients.merge(encounters, on="patient_ID")
    results.append({"outcome": "silent", "message": "merged without error", "result": len(merged)})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# 3c: Accessing column from wrong table post-join
try:
    joined = patients.merge(encounters, on="patient_id")
    val = joined["prescription_id"]
    results.append({"outcome": "silent", "message": "accessed without error", "result": None})
except KeyError as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

print(json.dumps(results))
