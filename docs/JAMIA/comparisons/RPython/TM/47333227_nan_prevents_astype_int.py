# ID: SO#47333227
# Language: Python
# Bug class: Nullable
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: NaN in column prevents astype(int). Missing values block type conversion.
# Reproduction status: Live
# Type system catch: `number` rejects `number | null`

import pandas as pd
import numpy as np

df = pd.DataFrame({
    'x': [1.0, 2.0, np.nan, 4.0, 5.0],
    'y': [10, 20, 30, 40, 50],
})

# BUG: NaN in column prevents astype(int)
try:
    df['x'] = df['x'].astype(int)
    print(df)
except (ValueError, TypeError) as e:
    print(f"Crash: {e}")
