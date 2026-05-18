# ID: SO#44616546
# Language: Python
# Bug class: Value type
# Runtime consequence: DC
# In study: Yes
# Inclusion rationale: timedelta column mean() fails "no numeric types to aggregate". On modern pandas, silently drops column instead of crashing (DC behavior).
# Reproduction status: Live
# Type system catch: Schema type tracks column presence

import pandas as pd

df = pd.DataFrame({
    'bank': ['Bank of Japan', 'Bank of Japan', 'Fed', 'Fed'],
    'diff': pd.to_timedelta(['57s', '21s', '8 days', '2 days']),
})

print("dtypes:")
print(df.dtypes)
print()

# BUG: timedelta not considered numeric for aggregation
# On older pandas: crashes with "No numeric types to aggregate"
# On modern pandas: silently drops the timedelta column (even worse — DC)
means = df.groupby('bank').mean(numeric_only=True)
print("Result (timedelta column silently dropped):")
print(means)
print(f"Columns: {list(means.columns)}")
# Empty DataFrame — the only data column vanished with no error
