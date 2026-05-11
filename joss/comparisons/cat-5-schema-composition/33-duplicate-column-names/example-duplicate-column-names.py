"""
Error Class 33: Duplicate Column Name Detection

Python silently allows duplicate column names in DataFrames.
Accessing a duplicated column returns a DataFrame instead of a
Series — silently changing the return type and breaking downstream code.
"""
import pandas as pd

# SILENT: DataFrame with duplicate column names is valid
df = pd.DataFrame([[1, 2, 3]], columns=["id", "name", "name"])
print(df.columns.tolist())  # ['id', 'name', 'name']

# SILENT: Accessing 'name' returns DataFrame (2 columns), not Series
result = df["name"]
print(type(result).__name__)  # DataFrame — not Series!
