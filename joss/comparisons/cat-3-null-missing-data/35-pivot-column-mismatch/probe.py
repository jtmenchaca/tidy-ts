"""Probe: Pivot Column Mismatch in Python"""
import json
import pandas as pd
import warnings
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))

results = []

vitals = pd.DataFrame({
    "patient_id": ["P001", "P001", "P002"],
    "metric": ["systolic", "diastolic", "systolic"],
    "value": [130, 85, 145],
})

# 35a: arithmetic on pivot null — systolic - diastolic with NaN from missing combo
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    wide = vitals.pivot_table(index="patient_id", columns="metric", values="value")
    wide["pp"] = wide["systolic"] - wide["diastolic"]
    p002_pp = wide.loc["P002", "pp"]
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": f"145-NaN={p002_pp}"})
    else:
        results.append({"outcome": "silent", "message": f"NaN propagates: 145-NaN={p002_pp}", "result": f"145-NaN={p002_pp}"})

print(json.dumps(results))
