"""Probe: Reorder vs Select in Python"""
import json
import pandas as pd
import warnings
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))

results = []

patients = pd.DataFrame({
    "patient_id": ["P001"],
    "name": ["Alice"],
    "age": [30],
    "insurance": ["Medicare"],
})

# 28a: df[['col1', 'col2']] silently drops other columns
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    selected = patients[["name", "patient_id"]]
    cols_lost = len(patients.columns) - len(selected.columns)
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": "Silently dropped 2 columns"})
    else:
        results.append({"outcome": "silent", "message": f"column selection silently dropped {cols_lost} columns", "result": "Silently dropped 2 columns"})


print(json.dumps(results))
