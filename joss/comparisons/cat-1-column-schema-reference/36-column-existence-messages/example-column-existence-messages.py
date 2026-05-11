"""
Error Class 36: Descriptive Runtime Error Messages

Python's KeyError just shows the column name — no context about
available columns or what operation was attempted.
"""
import pandas as pd

patients = pd.DataFrame({
    "patient_id": ["P001"],
    "name": ["Alice"],
    "department": ["ED"],
})

# Python error: KeyError: 'dept'
# No indication of available columns or similar names
try:
    patients.groupby("dept")
except KeyError as e:
    print(f"Error: {e}")  # Just 'dept' — no context
