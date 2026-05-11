"""Probe: GroupBy State Tracking in Python/pandas"""
import json
import pandas as pd
import warnings
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))

results = []

labs = pd.DataFrame({
    "patient_id": ["P001", "P001", "P002", "P002"],
    "test_name": ["BNP", "WBC", "BNP", "WBC"],
    "result_value": [1250, 15.2, 450, 8.1],
})

# 19b: Multi-level groupby + agg silently produces MultiIndex
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    multi = labs.groupby(["patient_id", "test_name"]).agg({"result_value": "mean"})
    is_multi = str(type(multi.index).__name__)
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": is_multi})
    else:
        results.append({"outcome": "silent", "message": f"groupby+agg silently produced {is_multi} index", "result": "produced MultiIndex silently"})

print(json.dumps(results))
