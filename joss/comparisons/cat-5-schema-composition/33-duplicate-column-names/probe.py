"""Probe: Duplicate Column Names in Python"""
import json
import pandas as pd
import warnings
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))

results = []

# 33a: Create df with duplicate "name" columns, then .str.upper()
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    try:
        df = pd.DataFrame([[1, "Alice", "ED"]], columns=["id", "name", "name"])
        upper = df["name"].str.upper()
        results.append({"outcome": "silent", "message": f"str.upper() returned {type(upper).__name__}", "result": str(upper)})
    except Exception as e:
        results.append({"outcome": "error", "message": str(e), "result": "str.upper() failed on duplicate col"})

print(json.dumps(results))
