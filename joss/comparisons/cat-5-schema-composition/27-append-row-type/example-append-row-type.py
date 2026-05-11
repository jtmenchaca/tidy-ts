"""
Error Class 27: Append Row Type Mismatch

Python's pd.concat with a dict silently fills NaN for missing columns
and coerces types without warning.
"""
import pandas as pd

patients = pd.DataFrame({
    "patient_id": ["P001"],
    "name": ["Alice"],
    "age": [30],
})

# SILENT: Missing column filled with NaN
new_row = pd.DataFrame({"patient_id": ["P002"], "name": ["Bob"]})
combined = pd.concat([patients, new_row], ignore_index=True)
print(combined)
# age for P002 is NaN — no error, no warning

# SILENT: Wrong type coerced
bad_row = pd.DataFrame({"patient_id": ["P003"], "name": ["Carol"], "age": ["thirty"]})
combined2 = pd.concat([patients, bad_row], ignore_index=True)
print(combined2.dtypes)  # age becomes object — silently
