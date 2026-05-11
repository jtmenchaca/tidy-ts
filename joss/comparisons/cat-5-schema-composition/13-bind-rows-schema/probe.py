"""Probe: Bind Rows Schema Mismatch in Python/pandas"""
import json
import pandas as pd
import numpy as np
import warnings

results = []

labs_a = pd.DataFrame({
    "patient_id": ["P001", "P002"],
    "test_name": ["BNP", "WBC"],
    "result_value": [1250, 15.2],
    "lab_site": ["Main", "Main"],
})

labs_b = pd.DataFrame({
    "patient_id": ["P003", "P004"],
    "test_name": ["HbA1c", "Glucose"],
    "result_value": [8.9, 210],
    "reference_range": ["4.0-5.6", "70-100"],
})

# 13a: concat with different schemas — fills NaN silently
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    try:
        combined = pd.concat([labs_a, labs_b], ignore_index=True)
        nan_in_lab_site = int(combined["lab_site"].isna().sum())
        nan_in_ref_range = int(combined["reference_range"].isna().sum())
        if w:
            results.append({"outcome": "warning", "message": str(w[0].message), "result": None})
        else:
            results.append({"outcome": "silent", "message": f"missing cols filled with NaN: lab_site={nan_in_lab_site}, reference_range={nan_in_ref_range}", "result": "NaN-filled 2 missing cols"})
    except Exception as e:
        results.append({"outcome": "error", "message": str(e), "result": None})

# 13b: String op on NaN column after concat — silent propagation
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    try:
        combined["site_upper"] = combined["lab_site"].str.upper()
        nan_count = int(combined["site_upper"].isna().sum())
        if w:
            results.append({"outcome": "warning", "message": str(w[0].message), "result": None})
        else:
            results.append({"outcome": "silent", "message": f"NaN propagated in str.upper(): {nan_count} NaN rows", "result": "NaN propagated to 2 rows"})
    except Exception as e:
        results.append({"outcome": "error", "message": str(e), "result": None})

print(json.dumps(results))
