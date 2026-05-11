"""Probe: Column Type Constraint in Python"""
import json
import pandas as pd
import numpy as np
import warnings
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))

results = []

patients = pd.DataFrame({
    "name": ["Alice", "Bob"],
    "age": [30, 45],
    "weight": [65.5, 80.0],
    "insurance": ["Medicare", "Medicaid"],
})

# 25a: Applying * 2 to mixed columns — string repetition for non-numeric
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    result = patients[["age", "insurance"]].apply(lambda x: x * 2)
    ins_val = result["insurance"].iloc[0]
    is_repeated = ins_val == "MedicareMedicare"
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": "String repeated, not doubled"})
    else:
        results.append({"outcome": "silent", "message": f"* 2 on string column repeated string: {is_repeated}", "result": "String repeated, not doubled"})


print(json.dumps(results))
