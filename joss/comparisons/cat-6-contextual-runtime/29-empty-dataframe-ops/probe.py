"""Probe: Empty DataFrame Operations in Python"""
import json
import pandas as pd
import numpy as np
import warnings
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))

results = []

# 29a: sum on empty → arithmetic on fabricated 0
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    empty = pd.DataFrame({"x": pd.Series(dtype=float)})
    total = empty["x"].sum()
    adjusted = total * 2  # 0 * 2 = 0 — looks like a real result
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": None})
    else:
        results.append({"outcome": "silent", "message": f"sum of empty returned {total}, adjusted={adjusted}", "result": f"sum()=0, 0*2={int(adjusted)}"})

# 29b: mean on empty → arithmetic on fabricated NaN
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    avg = empty["x"].mean()
    adjusted = avg * 2  # NaN * 2 = NaN — propagates silently
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": None})
    else:
        results.append({"outcome": "silent", "message": f"mean of empty returned NaN, adjusted={adjusted}", "result": f"mean()=NaN, NaN*2=NaN"})

print(json.dumps(results))
