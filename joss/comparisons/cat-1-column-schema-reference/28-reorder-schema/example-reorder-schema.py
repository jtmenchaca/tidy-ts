"""
Error Class 28: Reorder vs Select Schema Preservation

Python has no built-in "reorder but keep all" operation.
df[['col1', 'col2']] silently drops all other columns.
If you meant to reorder, you accidentally lose data.
"""
import pandas as pd

patients = pd.DataFrame({
    "patient_id": ["P001"],
    "name": ["Alice"],
    "age": [30],
    "insurance": ["Medicare"],
})

# SILENT: Selecting columns drops the rest — if you meant "reorder", data is lost
reordered = patients[["name", "patient_id"]]
print(reordered.columns.tolist())  # ['name', 'patient_id'] — age, insurance gone!

# To actually reorder and keep all, you need a verbose pattern:
# reordered = patients[["name", "patient_id"] + [c for c in patients.columns if c not in ["name", "patient_id"]]]
