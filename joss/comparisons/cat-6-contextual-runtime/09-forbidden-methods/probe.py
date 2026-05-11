"""Probe: API Escape / Direct Mutation in Python/pandas"""
import json
import pandas as pd
import warnings
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))
results = []

patients = pd.DataFrame({
    "patient_id": ["P001", "P002", "P003"],
    "first_name": ["Maria", "James", "Abigail"],
    "age": [66, 49, 34],
})

# 9a: Direct mutation via .loc — no immutability protection
try:
    patients_copy = patients.copy()
    patients_copy.loc[0, "age"] = -5
    val = int(patients_copy.loc[0, "age"])
    results.append({"outcome": "silent", "message": f"set age to {val} — no error on invalid value", "result": "age set to -5, no error"})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# 9b: .apply() returning mixed types
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    try:
        def process(row):
            if row["age"] > 50:
                return row["age"]
            return "young"

        patients_copy = patients.copy()
        patients_copy["status"] = patients_copy.apply(process, axis=1)
        dtype = str(patients_copy["status"].dtype)
        if w:
            results.append({"outcome": "warning", "message": str(w[0].message), "result": "dtype became object (mixed)"})
        else:
            results.append({"outcome": "silent", "message": f"mixed types, column dtype={dtype}", "result": "dtype became object (mixed)"})
    except Exception as e:
        results.append({"outcome": "error", "message": str(e), "result": None})

# 9c: Escape via .values — loses dtype, arithmetic on strings silently produces NaN
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    try:
        arr = patients[["first_name", "age"]].values  # numpy object array
        total = arr[:, 1].sum()  # works, but arr[:, 0].sum() concatenates strings
        str_sum = arr[:, 0].sum()
        if w:
            results.append({"outcome": "warning", "message": str(w[0].message), "result": "string sum via .values"})
        else:
            results.append({"outcome": "silent", "message": f".values sum of strings: {str_sum}", "result": "string concat via .values"})
    except Exception as e:
        results.append({"outcome": "error", "message": str(e), "result": None})

print(json.dumps(results))
