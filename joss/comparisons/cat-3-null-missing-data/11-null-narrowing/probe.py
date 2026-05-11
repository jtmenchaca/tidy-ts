"""Probe: Null Narrowing Errors in Python/pandas"""
import json
import pandas as pd
import numpy as np
import warnings
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))
results = []

labs = pd.read_csv("../fixtures/lab_results.csv")

# 11a: Division with NaN — NaN propagates silently
try:
    labs["pct"] = labs["result_value"] / labs["reference_high"]
    nan_count = int(labs["pct"].isna().sum())
    results.append({"outcome": "silent", "message": f"{nan_count} NaN from null div", "result": f"{nan_count} NaN from null div"})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# 11b: Re-introduce NaN after fillna, then divide — NaN propagates again
try:
    filled = labs.copy()
    filled["reference_high"] = filled["reference_high"].fillna(999)
    filled.loc[filled["result_value"] > 150, "reference_high"] = np.nan
    filled["pct"] = filled["result_value"] / filled["reference_high"]
    nan_count = int(filled["pct"].isna().sum())
    results.append({"outcome": "silent", "message": f"{nan_count} NaN after re-null div", "result": f"{nan_count} NaN after re-null div"})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

print(json.dumps(results))
