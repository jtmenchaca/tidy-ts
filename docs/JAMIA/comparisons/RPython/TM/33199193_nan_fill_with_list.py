# ID: SO#33199193
# Language: Python
# Bug class: Nullable
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: NaN in list-type column can't be filled with empty list. Missing value handling type mismatch.
# Reproduction status: Live
# Type system catch: `number[] | null` typed column; fillna enforces compatible fill value

import pandas as pd
import numpy as np

df = pd.DataFrame({
    "date": ["2011-04-23", "2011-04-24", "2011-04-25", "2011-04-26", "2011-04-27"],
    "ids": [[0, 1, 2, 3], [0, 1, 2, 3], [0, 1, 2, 3], np.nan, [0, 1, 2, 3]],
})

print("DataFrame:")
print(df)
print(f"\nids dtype: {df['ids'].dtype}")
print()

# The SO bug: fillna([]) crashes
try:
    result = df.fillna([])
    print("Unexpectedly succeeded")
    print(result)
except Exception as e:
    print(f"Crash with fillna([]): {type(e).__name__}: {e}")

print()

# The fix: iterate and set individually
for row in df.loc[df.ids.isnull(), 'ids'].index:
    df.at[row, 'ids'] = []

print("After manual fix:")
print(df)
