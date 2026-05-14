import pandas as pd

patients = pd.DataFrame({
    "patient_id": ["P001", "P002", "P003"],
    "name": ["Alice", "Bob", "Carol"],
})

encounters = pd.DataFrame({
    "patient_id": ["P001", "P001", "P002"],
    "los_days": [3, 7, None],
})

joined = patients.merge(
    encounters, on="patient_id", how="left")

# los_days is NaN for unmatched patients
joined["los_weeks"] = joined["los_days"] / 7

# No error. No warning.
print(joined[["patient_id", "name", "los_days", "los_weeks"]])
