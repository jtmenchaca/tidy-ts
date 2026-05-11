"""Probe: Schema Evolution Errors in Python/pandas"""
import json
import pandas as pd
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))
results = []

encounters = pd.read_csv("../fixtures/encounters.csv")

# 4a: Accessing dropped column
try:
    slim = encounters[["encounter_id", "patient_id", "department"]]
    val = slim["attending_physician"]
    results.append({"outcome": "silent", "message": "accessed without error", "result": None})
except KeyError as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# 4b: Accessing original columns after groupby/agg
try:
    summary = encounters.groupby("department").size().reset_index(name="count")
    filtered = summary[summary["encounter_type"] == "Inpatient"]
    results.append({"outcome": "silent", "message": "filtered without error", "result": len(filtered)})
except KeyError as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# 4c: Sorting by dropped column
try:
    no_physician = encounters.drop(columns=["attending_physician"])
    sorted_df = no_physician.sort_values("attending_physician")
    results.append({"outcome": "silent", "message": "sorted without error", "result": None})
except KeyError as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

print(json.dumps(results))
