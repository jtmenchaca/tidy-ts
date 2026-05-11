"""Probe: Aggregation on Columns with Missing Data in Python/pandas"""
import json
import pandas as pd
import numpy as np
import warnings
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))
results = []

labs = pd.read_csv("../fixtures/lab_results.csv")

# 12a: mean() then arithmetic — NaN skipped, doubled silently uses partial mean
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    avg = labs["reference_high"].mean()
    doubled = avg * 2
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": "mean*2 skipped NaN silently"})
    else:
        results.append({"outcome": "silent", "message": f"mean={avg}, doubled={doubled} (NaN skipped)", "result": "mean*2 skipped NaN silently"})

# 12b: sum() then arithmetic — NaN skipped, doubled silently uses partial sum
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    total = labs["reference_high"].sum()
    doubled = total * 2
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": "sum*2 skipped NaN silently"})
    else:
        results.append({"outcome": "silent", "message": f"sum={total}, doubled={doubled} (NaN skipped)", "result": "sum*2 skipped NaN silently"})

# 12c: min() then arithmetic — NaN skipped, doubled silently uses partial min
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    mn = labs["reference_high"].min()
    doubled = mn * 2
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": "min*2 skipped NaN silently"})
    else:
        results.append({"outcome": "silent", "message": f"min={mn}, doubled={doubled} (NaN skipped)", "result": "min*2 skipped NaN silently"})

# 12d: groupby mean then arithmetic — NaN groups produce NaN*2=NaN
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    grouped = labs.groupby("test_name")["reference_high"].mean()
    inc = grouped + 1
    nan_count = inc.isna().sum()
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": f"{nan_count} NaN+1 still NaN"})
    else:
        results.append({"outcome": "silent", "message": f"{nan_count} groups: NaN+1 still NaN", "result": f"{nan_count} NaN+1 still NaN"})

print(json.dumps(results))
