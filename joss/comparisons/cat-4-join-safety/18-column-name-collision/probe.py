"""Probe: Column Name Collision in Python/pandas"""
import json
import pandas as pd
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))

results = []

admissions = pd.DataFrame({
    "patient_id": ["P001", "P002"],
    "date": ["2024-01-15", "2024-02-20"],
    "department": ["ED", "ICU"],
})

discharges = pd.DataFrame({
    "patient_id": ["P001", "P002"],
    "date": ["2024-01-18", "2024-02-25"],
    "disposition": ["Home", "SNF"],
})

# 18a: Explicit suffixes — access original name
try:
    joined = admissions.merge(discharges, on="patient_id", suffixes=("_admit", "_discharge"))
    _ = joined["date"]
    results.append({"outcome": "silent", "message": "accessed 'date'", "result": None})
except KeyError as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# 18b: No suffixes — access ambiguous original name
try:
    joined = admissions.merge(discharges, on="patient_id")
    _ = joined["date"]
    results.append({"outcome": "silent", "message": "accessed 'date'", "result": None})
except KeyError as e:
    results.append({"outcome": "error", "message": str(e), "result": None})


print(json.dumps(results))
