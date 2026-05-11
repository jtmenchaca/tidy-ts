"""Probe: Window Function Output Type in Python"""
import json
import pandas as pd
import numpy as np
import warnings
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))

results = []

values = pd.Series([100, 200, 300, 400])

# 24a: shift() silently introduces NaN
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    lagged = values.shift(1)
    nan_count = int(lagged.isna().sum())
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": nan_count})
    else:
        results.append({"outcome": "silent", "message": f"shift() silently introduced {nan_count} NaN", "result": "shift() introduced 1 NaN"})

# 24b: Arithmetic on NaN from shift propagates silently
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    diff = lagged - values
    nan_count = int(diff.isna().sum())
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": nan_count})
    else:
        results.append({"outcome": "silent", "message": f"arithmetic on shifted NaN produced {nan_count} NaN", "result": "NaN propagated in subtraction"})

print(json.dumps(results))
