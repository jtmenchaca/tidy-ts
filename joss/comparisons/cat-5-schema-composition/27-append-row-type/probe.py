"""Probe: Append Row Type Mismatch in Python"""
import json
import pandas as pd
import numpy as np
import warnings
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))

results = []

patients = pd.DataFrame({
    "patient_id": ["P001"],
    "name": ["Alice"],
    "age": [30],
})

# 27a: Missing column silently filled with NaN
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    new_row = pd.DataFrame({"patient_id": ["P002"], "name": ["Bob"]})
    combined = pd.concat([patients, new_row], ignore_index=True)
    has_nan = bool(combined["age"].isna().any())
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": "Missing col filled with NaN"})
    else:
        results.append({"outcome": "silent", "message": f"missing column silently filled with NaN: {has_nan}", "result": "Missing col filled with NaN"})

# 27b: Wrong type silently coerced
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    bad_row = pd.DataFrame({"patient_id": ["P003"], "name": ["Carol"], "age": ["thirty"]})
    combined2 = pd.concat([patients, bad_row], ignore_index=True)
    dtype = str(combined2["age"].dtype)
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": "Age dtype coerced to object"})
    else:
        results.append({"outcome": "silent", "message": f"wrong type coerced age to '{dtype}'", "result": "Age dtype coerced to object"})

print(json.dumps(results))
