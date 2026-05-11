"""Probe: Category 6 — Contextual & Runtime Safety Errors in Python/pandas

Consolidates error classes 19, 29, 31.
"""
import json
import pandas as pd
import numpy as np
import warnings
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))
results = []

# ═══════════════════════════════════════════════════════════════════════════════
# Residual grouping after summarize
# ═══════════════════════════════════════════════════════════════════════════════

labs = pd.DataFrame({
    "patient_id": ["P001", "P001", "P002", "P002"],
    "test_name": ["BNP", "WBC", "BNP", "WBC"],
    "result_value": [1250, 15.2, 450, 8.1],
})

# a: Multi-level groupby + agg silently produces MultiIndex
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    multi = labs.groupby(["patient_id", "test_name"]).agg({"result_value": "mean"})
    is_multi = str(type(multi.index).__name__)
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": is_multi})
    else:
        results.append({"outcome": "silent", "message": f"groupby+agg silently produced {is_multi} index", "result": "produced MultiIndex silently"})

# ═══════════════════════════════════════════════════════════════════════════════
# Empty DataFrame operations
# ═══════════════════════════════════════════════════════════════════════════════

# b: sum on empty — arithmetic on fabricated 0
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    empty = pd.DataFrame({"x": pd.Series(dtype=float)})
    total = empty["x"].sum()
    adjusted = total * 2  # 0 * 2 = 0 — looks like a real result
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": None})
    else:
        results.append({"outcome": "silent", "message": f"sum of empty returned {total}, adjusted={adjusted}", "result": f"sum()=0, 0*2={int(adjusted)}"})

# c: mean on empty — arithmetic on fabricated NaN
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    avg = empty["x"].mean()
    adjusted = avg * 2  # NaN * 2 = NaN — propagates silently
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": None})
    else:
        results.append({"outcome": "silent", "message": f"mean of empty returned NaN, adjusted={adjusted}", "result": f"mean()=NaN, NaN*2=NaN"})

# ═══════════════════════════════════════════════════════════════════════════════
# Nullable vs optional distinction
# ═══════════════════════════════════════════════════════════════════════════════

# d: Empty cell and missing column both become NaN — indistinguishable
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

# e: conditional fill — only check for explicit null, miss absent column
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
