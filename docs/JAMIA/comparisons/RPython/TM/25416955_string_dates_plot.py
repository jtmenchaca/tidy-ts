# ID: SO#25416955
# Language: Python
# Bug class: Value type
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: Matplotlib date axis from string column not parsed. String where date expected.
# Reproduction status: Live
# Type system catch: `Temporal` rejects `string`

import pandas as pd
import numpy as np

# Simulate data read from file with string dates
df = pd.DataFrame({
    'time': ['2014-07-10 11:49:14', '2014-07-10 11:50:14', '2014-07-10 11:51:14'],
    'amount': [45, 45, 21],
})

print(f"time dtype: {df['time'].dtype}")

# BUG: trying to do datetime arithmetic on strings
try:
    diff = df['time'].iloc[1] - df['time'].iloc[0]
    print(f"diff: {diff}")
except TypeError as e:
    print(f"Crash: {e}")
