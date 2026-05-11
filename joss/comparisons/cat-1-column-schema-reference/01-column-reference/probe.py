"""Probe: Column Reference Errors in Python/pandas"""
import json
import pandas as pd
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))
results = []

patients = pd.read_csv("../fixtures/patients.csv")
labs = pd.read_csv("../fixtures/lab_results.csv")

# 1a: Misspelled column in mutate-like operation
try:
    patients["full_name"] = patients["patientId"] + " " + patients["last_name"]
    results.append({"outcome": "silent", "message": "no error", "result": None})
except KeyError as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# 1b: Nonexistent column in filter
try:
    filtered = patients[patients["diagnosis"] == "I50.9"]
    results.append({"outcome": "silent", "message": "no error", "result": None})
except KeyError as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# 1c: Misspelled column in sort
try:
    sorted_labs = labs.sort_values("result_values", ascending=False)
    results.append({"outcome": "silent", "message": "no error", "result": None})
except KeyError as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

print(json.dumps(results))
