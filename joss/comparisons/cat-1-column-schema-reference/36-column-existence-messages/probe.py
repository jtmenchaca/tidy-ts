"""Probe: Column Existence Error Messages in Python"""
import json
import pandas as pd
import warnings
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))

results = []

patients = pd.DataFrame({
    "patient_id": ["P001"],
    "name": ["Alice"],
    "department": ["ED"],
})

# 36a: groupby with wrong column — error message quality
try:
    patients.groupby("dept")
    results.append({"outcome": "silent", "message": "groupby succeeded", "result": None})
except KeyError as e:
    msg = str(e)
    results.append({"outcome": "error", "message": msg, "result": None})

# 36b: Column access error message quality
try:
    _ = patients["dept"]
    results.append({"outcome": "silent", "message": "access succeeded", "result": None})
except KeyError as e:
    msg = str(e)
    results.append({"outcome": "error", "message": msg, "result": None})

print(json.dumps(results))
