# ID: SO#15138973
# Language: Python
# Bug class: Nullable
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: value_counts().max() fails because NaN in results. Missing values propagate into aggregation.
# Reproduction status: Fixed (pandas 2.x handles NaN in aggregation results)
# Type system catch: `number` rejects `number | null`

import pandas as pd
import numpy as np

df = pd.DataFrame({
    'item': ['apple', 'banana', 'apple', np.nan, 'banana', 'apple', np.nan],
})

counts = df['item'].value_counts()
print(f"value_counts:\n{counts}")
print(f"max: {counts.max()}")
# On modern pandas this works fine — the bug was in older versions
# where NaN handling in value_counts produced issues
