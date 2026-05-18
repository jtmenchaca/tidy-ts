# ID: SO#30132282
# Language: Python
# Bug class: Value type
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: .str accessor on datetime Series. Wrong accessor for column type.
# Reproduction status: Live
# Type system catch: `.str` accessor rejects `Temporal` column; requires `string`

import pandas as pd

dates = pd.to_datetime(pd.Series(['20010101', '20010331']), format='%Y%m%d')
print(f"dtype: {dates.dtype}")

# BUG: .str accessor on datetime Series
try:
    result = dates.str.slice(0, 10)
    print(result)
except AttributeError as e:
    print(f"Crash: {e}")
