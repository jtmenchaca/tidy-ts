"""
Error Class 15: Distinct Column Narrowing

Python's drop_duplicates() keeps all columns — it does not narrow
the schema. You can still access any column after dedup, even though
the semantics may be ambiguous (which row's value is kept?).
"""
import pandas as pd

encounters = pd.DataFrame({
    "patient_id": ["P001", "P001", "P002", "P002"],
    "department": ["Cardiology", "Cardiology", "Emergency", "Primary Care"],
    "encounter_type": ["Outpatient", "Inpatient", "ED", "Outpatient"],
    "physician": ["Dr. Patel", "Dr. Patel", "Dr. Lee", "Dr. Martinez"],
})

# drop_duplicates keeps all columns — which physician is kept is arbitrary
unique_depts = encounters.drop_duplicates(subset=["patient_id", "department"])
print(unique_depts)
# physician column still present — but which value is undefined behavior
# (depends on which row pandas keeps, usually first)

# No warning that physician value is arbitrary for the kept rows
print(unique_depts["physician"].tolist())
