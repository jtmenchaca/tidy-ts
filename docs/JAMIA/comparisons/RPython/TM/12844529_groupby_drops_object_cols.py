# ID: SO#12844529
# Language: Python
# Bug class: Column ref
# Runtime consequence: DC
# In study: Yes
# Inclusion rationale: groupby aggregate silently drops object-dtype columns. Output missing columns, no warning.
# Reproduction status: Live
# Type system catch: Schema type tracks column presence

import pandas as pd

# Data loaded as object dtype (common when reading from CSV without type inference)
df = pd.DataFrame({
    'city': ['NYC', 'NYC', 'LA', 'LA'],
    'temp': ['72', '75', '80', '82'],  # strings, not numbers
    'humidity': ['45', '50', '60', '55'],  # strings, not numbers
})

print("dtypes:")
print(df.dtypes)
print()

# BUG: groupby().mean() silently drops non-numeric columns — returns empty
result = df.groupby('city').mean(numeric_only=True)
print("After groupby().mean() — all value columns silently dropped:")
print(result)
print(f"Result shape: {result.shape}")
# Empty DataFrame with 0 columns. No error. No warning.
