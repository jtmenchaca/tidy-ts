# ID: SO#17690738
# Language: Python
# Bug class: Value type
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: Assigning datetime to integer-indexed Series. Type mismatch on assignment.
# Reproduction status: Live
# Type system catch: `Temporal` rejects `string`

import pandas as pd

date_strings = ('2008-12-20', '2008-12-21', '2008-12-22', '2008-12-23')

a = pd.Series(range(4), index=range(4))
print(f"Original dtype: {a.dtype}")

try:
    for idx, date in enumerate(date_strings):
        a[idx] = pd.to_datetime(date)
    print(f"After assignment dtype: {a.dtype}")
    print(a)
except TypeError as e:
    print(f"Crash: {e}")
