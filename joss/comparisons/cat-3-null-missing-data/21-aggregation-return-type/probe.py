"""Probe: Aggregation Return Type Narrowing in Python"""
import json
import pandas as pd
import numpy as np
import warnings
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))

results = []

values = pd.Series([1250, np.nan, 450])

# 21a: sum() silently skips NaN — returns 1700, not NaN
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    total = values.sum()
    skipped = np.isnan(values).sum()
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": float(total)})
    else:
        results.append({"outcome": "silent", "message": f"sum() silently skipped {int(skipped)} NaN, returned {total}", "result": "Skipped 1 NaN, returned 1700"})

# 21b: Arithmetic on result works — no type indication data was incomplete
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    per_patient = total / 2
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": float(per_patient)})
    else:
        results.append({"outcome": "silent", "message": f"arithmetic on NaN-skipped sum succeeded: {per_patient}", "result": "Divided NaN-skipped sum by 2"})

print(json.dumps(results))
