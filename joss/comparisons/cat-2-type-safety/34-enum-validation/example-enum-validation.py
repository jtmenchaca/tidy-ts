"""
Error Class 34: Enum/Categorical Validation

Python reads any string value from CSV without validation.
Even with dtype="category", unknown values are accepted silently.
"""
import pandas as pd

# SILENT: Any value accepted, no validation
df = pd.read_csv(pd.io.common.StringIO(
    "patient_id,sex,insurance\\n"
    "P001,M,Medicare\\n"
    "P002,X,Unknown\\n"  # invalid sex and insurance
))
print(df)  # X and Unknown silently accepted

# Even with category dtype, unknown values are accepted
df["sex"] = df["sex"].astype("category")
print(df["sex"].cat.categories.tolist())  # ['M', 'X'] — X silently included
