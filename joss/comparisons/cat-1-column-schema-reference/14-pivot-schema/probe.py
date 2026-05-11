"""Probe: Pivot Type Safety in Python/pandas"""
import json
import pandas as pd

results = []

vitals = pd.DataFrame({
    "patient_id": ["P001", "P001", "P002", "P002"],
    "metric": ["systolic", "diastolic", "systolic", "diastolic"],
    "value": [130, 85, 145, 92],
})

wide = vitals.pivot(index="patient_id", columns="metric", values="value").reset_index()
wide.columns.name = None

# 14a: Accessing non-existent pivot column
try:
    val = wide["temperature"]
    results.append({"outcome": "silent", "message": "accessed without error", "result": None})
except KeyError as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# 14b: Pre-pivot column gone
try:
    val = wide["metric"]
    results.append({"outcome": "silent", "message": "accessed without error", "result": None})
except KeyError as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

print(json.dumps(results))
