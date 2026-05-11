"""Probe: Mixed Return Types in Python/pandas"""
import json
import pandas as pd
import warnings

results = []

labs = pd.DataFrame({
    "patient_id": ["P001", "P002", "P003"],
    "test_name": ["BNP", "WBC", "Glucose"],
    "result_value": [1250, 15.2, 210],
})

# 16a: .apply() returning mixed types, then arithmetic — silent coercion
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    def classify(row):
        if row["result_value"] > 100:
            return "HIGH"
        return row["result_value"]
    labs["status"] = labs.apply(classify, axis=1)
    try:
        labs["doubled"] = labs["status"] * 2
        # string * 2 repeats the string in Python: "HIGH" * 2 = "HIGHHIGH"
        has_repeated = any(isinstance(v, str) and len(v) > 4 for v in labs["doubled"])
        if w:
            results.append({"outcome": "warning", "message": str(w[0].message), "result": "string repeated, not math"})
        elif has_repeated:
            results.append({"outcome": "silent", "message": "string * 2 repeated string silently", "result": "string repeated, not math"})
        else:
            results.append({"outcome": "silent", "message": "coerced silently", "result": "coerced to object dtype"})
    except Exception as e:
        results.append({"outcome": "error", "message": str(e), "result": None})

print(json.dumps(results))
