# ID: SO#19105976
# Language: Python
# Bug class: Value type
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: .date() called on Series instead of element. Typed mutate enforces value-level operations.
# Reproduction status: Live
# Type system catch: Typed `mutate` operates on values; `.date()` is value-level, not Series-level

import pandas as pd

dates = pd.to_datetime(pd.Series(['2023-01-15', '2023-02-20', '2023-03-25']))

# BUG: .date() is a Timestamp method, not a Series method
try:
    result = dates.date()
    print(result)
except (TypeError, AttributeError) as e:
    print(f"Crash: {e}")
