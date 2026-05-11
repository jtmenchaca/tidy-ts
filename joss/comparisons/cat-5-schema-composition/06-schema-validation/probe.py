"""Probe: Schema Validation Errors in Python/pandas"""
import json
import pandas as pd
import numpy as np
import warnings
import os
import tempfile

os.chdir(os.path.dirname(os.path.abspath(__file__)))
results = []

# 6a: Non-numeric value in numeric column
csv_bad_type = "lab_id,result_value\nL1,100\nL2,pending\nL3,200\n"
with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as f:
    f.write(csv_bad_type)
    tmp_path = f.name

with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    try:
        df = pd.read_csv(tmp_path)
        dtype = str(df["result_value"].dtype)
        if dtype == "object":
            results.append({"outcome": "silent", "message": f"column dtype became '{dtype}' — mixed types, no error", "result": "dtype silently became object"})
        elif w:
            results.append({"outcome": "warning", "message": str(w[0].message), "result": f"dtype became {dtype}"})
        else:
            results.append({"outcome": "silent", "message": f"loaded as {dtype}", "result": f"mixed types silently accepted"})
    except Exception as e:
        results.append({"outcome": "error", "message": str(e), "result": None})

# 6b: Missing column — accessed after load
try:
    df = pd.read_csv("../fixtures/lab_results.csv")
    val = df["nonexistent_column"]
    results.append({"outcome": "silent", "message": "accessed without error", "result": None})
except KeyError as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# 6c: Empty cell in column that should be non-null
# result_value has no empty cells, but reference_high does (rows L3015, L3016)
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    try:
        df = pd.read_csv("../fixtures/lab_results.csv")
        nan_count = int(df["reference_high"].isna().sum())
        if w:
            results.append({"outcome": "warning", "message": str(w[0].message), "result": f"{nan_count} cells silently became NaN"})
        else:
            results.append({"outcome": "silent", "message": f"empty cells became NaN silently (count={nan_count})", "result": f"{nan_count} cells silently became NaN"})
    except Exception as e:
        results.append({"outcome": "error", "message": str(e), "result": None})

import os
os.unlink(tmp_path)

print(json.dumps(results))
