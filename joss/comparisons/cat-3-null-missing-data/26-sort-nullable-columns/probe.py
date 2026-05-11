"""Probe: Sorting on Nullable Columns in Python"""
import json
import pandas as pd
import numpy as np
import warnings
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))

results = []

labs = pd.DataFrame({
    "patient_id": ["P001", "P002", "P003"],
    "result_value": [100, np.nan, 50],
})

# 26a: sort_values silently puts NaN at end
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    sorted_df = labs.sort_values("result_value")
    last_val = sorted_df["result_value"].iloc[-1]
    nan_at_end = pd.isna(last_val)
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": "NaN silently placed at end"})
    else:
        results.append({"outcome": "silent", "message": f"sort_values silently placed NaN at end: {nan_at_end}", "result": "NaN silently placed at end"})

# 26b: No indication that sort order was affected by NaN
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    # rank() with NaN — silently assigns NaN rank
    ranks = labs["result_value"].rank()
    nan_rank_count = int(ranks.isna().sum())
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": "NaN rank returned as NaN"})
    else:
        results.append({"outcome": "silent", "message": f"rank() silently handled NaN ({nan_rank_count} NaN ranks)", "result": "NaN rank returned as NaN"})

print(json.dumps(results))
