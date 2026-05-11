"""Probe: Transpose Type Safety in Python"""
import json
import pandas as pd
import warnings
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))

results = []

vitals = pd.DataFrame({
    "metric": ["systolic", "diastolic"],
    "P001": [120, 80],
    "P002": [145, 92],
})

# Transpose without set_index — mixed types (string + int) in each column
transposed = vitals.T
transposed.columns = ["row_0", "row_1"]

# 30a: Arithmetic on transposed column — string repetition instead of math
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    doubled = transposed["row_0"] * 2
    vals = doubled.tolist()
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": None})
    else:
        # vals[0] is "systolicsystolic" (string repeated), vals[1:] are numeric
        results.append({"outcome": "silent", "message": f"string * 2 = {vals[0]}", "result": f"str*2={repr(vals[0])}"})

# 30b: Access pre-transpose column name — runtime KeyError
try:
    _ = transposed["P001"]
    results.append({"outcome": "silent", "message": "accessed pre-transpose col", "result": None})
except KeyError as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

print(json.dumps(results))
