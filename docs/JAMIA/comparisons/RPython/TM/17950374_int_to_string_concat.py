# ID: SO#17950374
# Language: Python
# Bug class: Value type
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: Concatenating int column with string fails. Type mismatch in string operation.
# Reproduction status: Live
# Type system catch: `string + number` requires explicit template literal or `.toString()`

import pandas as pd

df = pd.DataFrame({
    'id': [1, 2, 3],
    'prefix': ['A', 'B', 'C'],
})

try:
    df['combined'] = df['prefix'] + df['id']
    print(df)
except TypeError as e:
    print(f"Crash: {e}")
