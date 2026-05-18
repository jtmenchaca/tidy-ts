# ID: SO#31269216
# Language: Python
# Bug class: Value type
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: str.upper() on mixed-type column fails. String method on non-string data.
# Reproduction status: Live
# Type system catch: Typed accessor rejects wrong column type

import pandas as pd
import numpy as np

df = pd.DataFrame({
    'ID': ['abc', 'def', 123, np.nan, 'ghi'],
})

print(f"dtype: {df['ID'].dtype}")

try:
    df['ID'] = list(map(str.upper, df['ID']))
    print(df)
except (TypeError, AttributeError) as e:
    print(f"Crash: {e}")
