"""Probe: Distinct Column Narrowing in Python/pandas"""
import json
import pandas as pd

results = []

encounters = pd.DataFrame({
    "patient_id": ["P001", "P001", "P002", "P002"],
    "department": ["Cardiology", "Cardiology", "Emergency", "Primary Care"],
    "encounter_type": ["Outpatient", "Inpatient", "ED", "Outpatient"],
    "physician": ["Dr. Patel", "Dr. Patel", "Dr. Lee", "Dr. Martinez"],
})

# 15a: drop_duplicates keeps all columns — no schema narrowing
try:
    unique = encounters.drop_duplicates(subset=["patient_id", "department"])
    has_physician = "physician" in unique.columns
    results.append({"outcome": "silent", "message": f"physician column still present: {has_physician} — arbitrary values kept, no warning", "result": "all columns kept silently"})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# 15b: drop_duplicates with keep='first' keeps all columns — silent
try:
    unique2 = encounters.drop_duplicates(subset=["patient_id", "department"], keep="first")
    has_physician = "physician" in unique2.columns
    results.append({"outcome": "silent", "message": f"physician column present: {has_physician}", "result": "all columns kept silently"})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

print(json.dumps(results))
