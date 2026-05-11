"""Probe: Implicit Type Coercion in Python/pandas"""
import json
import pandas as pd
import warnings
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))

results = []

numeric_doses = pd.DataFrame({
    "drug": ["Aspirin", "Lisinopril"],
    "dose": [325, 10],
})

text_doses = pd.DataFrame({
    "drug": ["Insulin", "Warfarin"],
    "dose": ["sliding scale", "per INR"],
})

# 20a: concat silently coerces dose from int64 to object
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    combined = pd.concat([numeric_doses, text_doses], ignore_index=True)
    dtype = str(combined["dose"].dtype)
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": dtype})
    else:
        results.append({"outcome": "silent", "message": f"concat coerced dose to '{dtype}' silently", "result": f"coerced to '{dtype}' dtype"})

# 20b: Arithmetic on mixed-type column — string repetition instead of multiplication
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    combined["doubled"] = combined["dose"] * 2
    # Check if any value is a repeated string (string * 2 = string + string)
    val = combined.loc[combined["drug"] == "Insulin", "doubled"].iloc[0]
    is_repeated = val == "sliding scalesliding scale"
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": is_repeated})
    else:
        results.append({"outcome": "silent", "message": f"'dose' * 2 repeated strings instead of multiplying: {is_repeated}", "result": "strings repeated, not math"})

print(json.dumps(results))
