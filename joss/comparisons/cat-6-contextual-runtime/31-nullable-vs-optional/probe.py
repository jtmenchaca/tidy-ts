"""Probe: Nullable vs Optional Distinction in Python"""
import json
import pandas as pd
import numpy as np
import warnings
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))

results = []

# 31a: Empty cell and missing column both become NaN — indistinguishable
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    df1 = pd.DataFrame({"id": ["P001"], "value": [np.nan]})  # explicitly missing
    df2 = pd.DataFrame({"id": ["P002"]})  # field doesn't exist
    combined = pd.concat([df1, df2], ignore_index=True)
    # Both P001 (explicit NaN) and P002 (missing column) have NaN
    both_nan = bool(combined["value"].isna().all())
    distinguishable = False  # Can't tell which is which
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": None})
    else:
        results.append({"outcome": "silent", "message": f"null and missing both NaN, distinguishable: {distinguishable}", "result": "null and missing both NaN"})

# 31b: conditional fill — only check for explicit null, miss absent column
# In Python, both are NaN so fillna catches both indiscriminately
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    filled = combined["value"].apply(lambda x: "inconclusive" if pd.isna(x) else x)
    # Both rows get "inconclusive" — can't give absent row a different fill
    vals = filled.tolist()
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": None})
    else:
        results.append({"outcome": "silent", "message": f"both filled same: {vals}", "result": "both filled identically"})

print(json.dumps(results))
