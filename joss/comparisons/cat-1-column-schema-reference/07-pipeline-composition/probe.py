"""Probe: Pipeline Composition Errors in Python/pandas"""
import json
import pandas as pd
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))
results = []

encounters = pd.read_csv("../fixtures/encounters.csv")
labs = pd.read_csv("../fixtures/lab_results.csv")

# 7a: Using old column name after rename
try:
    pipeline = encounters.rename(columns={"department": "dept"})
    pipeline = pipeline[pipeline["department"] == "ICU"]
    results.append({"outcome": "silent", "message": "filtered without error", "result": len(pipeline)})
except KeyError as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# 7b: Accessing column removed by groupby/agg
try:
    pipeline = (
        encounters
        .merge(labs, on=["encounter_id", "patient_id"])
        [["patient_id", "department", "test_name", "result_value"]]
        .groupby("patient_id")
        .agg(max_lab=("result_value", "max"))
        .reset_index()
    )
    pipeline["dept"] = pipeline["department"]
    results.append({"outcome": "silent", "message": "accessed without error", "result": None})
except KeyError as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

print(json.dumps(results))
