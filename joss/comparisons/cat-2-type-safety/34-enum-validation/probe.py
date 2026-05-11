"""Probe: Enum Validation in Python"""
import json
import pandas as pd
import warnings
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))

results = []

encounters = pd.DataFrame({
    "patient_id": ["P001", "P002"],
    "status": pd.Categorical(["admitted", "discharged"],
                              categories=["admitted", "discharged", "transferred"]),
})

# 34a: filter on invalid enum value — silent (returns empty df)
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    filtered = encounters[encounters["status"] == "unknown"]
    nrows = len(filtered)
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": f"{nrows} rows (silent empty)"})
    else:
        results.append({"outcome": "silent", "message": f"filter on 'unknown' returned {nrows} rows", "result": f"{nrows} rows (silent empty)"})

print(json.dumps(results))
