"""Probe: Type Mismatch Errors in Python/pandas"""
import json
import pandas as pd
import numpy as np
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))
results = []

labs = pd.read_csv("../fixtures/lab_results.csv")

# 2a: Arithmetic on string column
try:
    labs["adjusted"] = labs["test_name"] + 10
    results.append({"outcome": "silent", "message": "no error", "result": str(labs["adjusted"].iloc[0])})
except TypeError as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# 2b: Numeric aggregation on string column
import warnings
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    try:
        avg = labs.groupby("test_name")["test_name"].mean()
        if w:
            results.append({"outcome": "warning", "message": str(w[0].message), "result": None})
        else:
            has_nan = avg.isna().any()
            results.append({"outcome": "silent", "message": f"returned NaN: {has_nan}", "result": None})
    except TypeError as e:
        results.append({"outcome": "error", "message": str(e), "result": None})

# 2c: Comparing number to string
try:
    filtered = labs[labs["result_value"] == "high"]
    results.append({"outcome": "silent", "message": f"rows returned: {len(filtered)} (expected 0, no error)", "result": "returned 0 rows, no error"})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

print(json.dumps(results))
