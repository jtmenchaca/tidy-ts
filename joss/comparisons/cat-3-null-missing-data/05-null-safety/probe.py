"""Probe: Null Safety Errors in Python/pandas"""
import json
import pandas as pd
import numpy as np
import warnings
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))
results = []

encounters = pd.read_csv("../fixtures/encounters.csv")
labs = pd.read_csv("../fixtures/lab_results.csv")

# 5a: String method on column with NaN (discharge_date has NaN for ED visits)
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    try:
        encounters["los_label"] = encounters["discharge_date"].str.slice(0, 10)
        has_nan = encounters["los_label"].isna().any()
        if w:
            results.append({"outcome": "warning", "message": str(w[0].message), "result": None})
        else:
            results.append({"outcome": "silent", "message": f"NaN propagated silently: {has_nan}", "result": "NaN propagated silently"})
    except Exception as e:
        results.append({"outcome": "error", "message": str(e), "result": None})

# 5b: Arithmetic on column with NaN (reference_high has NaN)
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    try:
        labs["deviation"] = labs["result_value"] - labs["reference_high"]
        has_nan = labs["deviation"].isna().any()
        if w:
            results.append({"outcome": "warning", "message": str(w[0].message), "result": None})
        else:
            results.append({"outcome": "silent", "message": f"NaN propagated silently: {has_nan}", "result": "NaN propagated silently"})
    except Exception as e:
        results.append({"outcome": "error", "message": str(e), "result": None})

# 5c: Comparison with NaN — filtering silently drops NaN rows
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    try:
        total_rows = len(labs)
        critical = labs[labs["reference_high"] > 100]
        nan_rows = labs["reference_high"].isna().sum()
        if w:
            results.append({"outcome": "warning", "message": str(w[0].message), "result": None})
        else:
            results.append({"outcome": "silent", "message": f"total={total_rows}, filtered={len(critical)}, NaN rows silently excluded={nan_rows}", "result": f"{nan_rows} NaN rows silently dropped"})
    except Exception as e:
        results.append({"outcome": "error", "message": str(e), "result": None})

print(json.dumps(results))
