# ID: SO#20625982
# Language: Python
# Bug class: Column ref
# Runtime consequence: DC
# In study: Yes
# Inclusion rationale: groupby.mean() silently drops timedelta column from output. Column vanishes with no error.
# Reproduction status: Live
# Type system catch: Schema type tracks column presence

import pandas as pd
import numpy as np

np.random.seed(42)
data = pd.DataFrame(np.random.rand(10, 2), columns=['f1', 'f2'])
data['td'] = pd.to_timedelta(np.random.rand(10) * 1e7, unit='ns')
data['group'] = ['A', 'B'] * 5

print("Original columns:", list(data.columns))
print(data.head())
print()

# BUG: groupby().mean() silently drops the timedelta column
result = data.groupby('group').mean(numeric_only=True)
print("After groupby().mean() — 'td' column silently dropped:")
print("Result columns:", list(result.columns))
print(result)
# No error. No warning. Column just vanishes.
