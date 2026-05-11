"""Probe: Conversion Narrowing Errors in Python/pandas"""
import json
import pandas as pd
import numpy as np
import warnings
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))
results = []

labs = pd.DataFrame({
    "lab_id": ["L1", "L2", "L3"],
    "test_name": ["BNP", "pH", "WBC"],
    "result_str": ["1250", "7.28", "pending"],
})

# 10a: to_numeric with errors='coerce' — unparseable becomes NaN silently
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    try:
        labs["result_num"] = pd.to_numeric(labs["result_str"], errors="coerce")
        nan_count = int(labs["result_num"].isna().sum())
        if w:
            results.append({"outcome": "warning", "message": str(w[0].message), "result": f"{nan_count} value coerced to NaN"})
        else:
            results.append({"outcome": "silent", "message": f"unparseable became NaN silently (count={nan_count})", "result": f"{nan_count} value coerced to NaN"})
    except Exception as e:
        results.append({"outcome": "error", "message": str(e), "result": None})

# 10b: Downstream arithmetic on NaN — silent propagation
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    try:
        labs["doubled"] = labs["result_num"] * 2
        nan_count = int(labs["doubled"].isna().sum())
        if w:
            results.append({"outcome": "warning", "message": str(w[0].message), "result": f"NaN propagated, {nan_count} NaN"})
        else:
            results.append({"outcome": "silent", "message": f"NaN propagated in arithmetic (count={nan_count})", "result": f"NaN propagated, {nan_count} NaN"})
    except Exception as e:
        results.append({"outcome": "error", "message": str(e), "result": None})

# 10c: mean() after conversion — silently skips NaN
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    try:
        avg = labs["result_num"].mean()
        if w:
            results.append({"outcome": "warning", "message": str(w[0].message), "result": "mean skipped NaN silently"})
        else:
            results.append({"outcome": "silent", "message": f"mean={avg}, skipped NaN silently", "result": "mean skipped NaN silently"})
    except Exception as e:
        results.append({"outcome": "error", "message": str(e), "result": None})

print(json.dumps(results))
