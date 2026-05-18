# ID: SO#37513355
# Language: Python
# Bug class: Data loading
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: Spark schema inference fails on mixed types. Load-time type inference error.
# Reproduction status: Live
# Type system catch: Schema rejects mixed-type columns; `number | null` not `number | string`

import pandas as pd
import numpy as np

# Simulate the SO scenario: CSV data where a column has mixed types
# (some values look numeric, others are strings)
df = pd.DataFrame({
    "id": ["10000001", "10000001", "10000002"],
    "status": ["OK", "OK", "PA"],
    "score": [543, 611, 691],
    "mixed_col": [1.5, "NA", 3.2],  # This is the problem column
})

print("DataFrame dtypes:")
print(df.dtypes)
print()
print("mixed_col dtype is 'object' because it contains both float and str:")
print(f"  dtype: {df['mixed_col'].dtype}")
print(f"  values: {df['mixed_col'].tolist()}")
print()

# The crash would happen here with PySpark:
# from pyspark.sql import SparkSession
# spark = SparkSession.builder.getOrCreate()
# sdf = spark.createDataFrame(df)
# TypeError: Can not merge type <class 'pyspark.sql.types.StringType'>
#            and <class 'pyspark.sql.types.DoubleType'>

# Without PySpark, demonstrate that pandas silently allows the mixed column:
print("pandas allows this silently — the column is object dtype.")
print("Spark would crash when trying to infer a consistent schema.")
print()

# Attempting numeric operations on the mixed column shows the issue:
try:
    result = df["mixed_col"].astype(float)
except (ValueError, TypeError) as e:
    print(f"Converting to float crashes: {e}")
