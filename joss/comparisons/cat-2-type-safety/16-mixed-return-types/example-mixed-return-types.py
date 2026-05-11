"""
Error Class 16: Return Type Consistency in Mutate

Python's .apply() returning mixed types silently coerces the column
to 'object' dtype. String and numeric methods then fail or produce
wrong results with no compile-time indication.
"""
import pandas as pd

labs = pd.DataFrame({
    "patient_id": ["P001", "P002", "P003"],
    "test_name": ["BNP", "WBC", "Glucose"],
    "result_value": [1250, 15.2, 210],
})

# SILENT: .apply() returning mixed types → object dtype
def classify(row):
    if row["result_value"] > 100:
        return "HIGH"       # string
    return row["result_value"]  # number

labs["status"] = labs.apply(classify, axis=1)
print(f"dtype: {labs['status'].dtype}")  # object — mixed types, no warning

# SILENT: .str.upper() on mixed-type column
# Numeric values become NaN silently
labs["upper"] = labs["status"].str.upper()
print(labs[["status", "upper"]])
# "HIGH" → "HIGH", 15.2 → NaN — no error, no warning
