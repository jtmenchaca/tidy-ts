"""Probe: Async/Sync Confusion in Python/pandas"""
import json
import pandas as pd
import warnings
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))
results = []

meds = pd.DataFrame({
    "drug": ["Aspirin"],
    "dose_mg": [325],
})

async def lookup_interaction(drug_name):
    return "none"

# 8a: async .apply() then filter — coroutine != "none", filter returns 0 rows
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    try:
        meds["interaction"] = meds["drug"].apply(lookup_interaction)
        filtered = meds[meds["interaction"] == "none"]
        nrows = len(filtered)
        if w:
            results.append({"outcome": "warning", "message": str(w[0].message), "result": f"{nrows} rows (coroutine != 'none')"})
        else:
            results.append({"outcome": "silent", "message": f"filter returned {nrows} rows (coroutine != 'none')", "result": f"{nrows} rows (coroutine != 'none')"})
    except Exception as e:
        results.append({"outcome": "error", "message": str(e), "result": "filter failed"})

print(json.dumps(results))
