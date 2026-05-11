"""
Error Class 25: Column Type Constraint in Specialized Verbs

Python lets you apply numeric functions to any column via
select_dtypes or apply. If the column isn't actually numeric,
the operation fails at runtime or produces wrong results.
"""
import pandas as pd
import numpy as np

patients = pd.DataFrame({
    "name": ["Alice", "Bob"],
    "age": [30, 45],
    "weight": [65.5, 80.0],
    "insurance": ["Medicare", "Medicaid"],
})

# Runtime error: log on string column
# np.log(patients[["age", "insurance"]])  # TypeError at runtime

# SILENT: select_dtypes("number") works, but if you manually select wrong columns...
# No compile-time check that your column list matches the expected type
result = patients[["age", "insurance"]].apply(lambda x: x * 2)
# age gets doubled (60, 90)
# insurance gets string-repeated: "MedicareMedicare", "MedicaidMedicaid"
print(result)
