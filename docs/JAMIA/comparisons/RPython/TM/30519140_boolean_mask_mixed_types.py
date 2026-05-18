# ID: SO#30519140
# Language: Python
# Bug class: Value type
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: Boolean mask on mixed-dtype DataFrame fails. Type inconsistency across columns.
# Reproduction status: Live
# Type system catch: Schema-typed columns prevent cross-type boolean mask assignment

import pandas as pd

df = pd.DataFrame({'A': [1, 2, 3], 'B': ['a', 'b', 'f']})
mask = df.isin([1, 3, 12, 'a'])

print("DataFrame:")
print(df)
print("\nMask:")
print(mask)
print()

# BUG: can't do inplace boolean setting on mixed-types with non-NaN value
try:
    df[mask] = 30
    print(df)
except TypeError as e:
    print(f"Crash: {e}")
