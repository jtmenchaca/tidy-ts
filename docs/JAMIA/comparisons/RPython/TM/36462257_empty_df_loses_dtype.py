# ID: SO#36462257
# Language: Python
# Bug class: Value type
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: Empty DataFrame loses dtype specification. Schema lost through operation.
# Reproduction status: Live
# Type system catch: Schema preserves column types through empty operations

import pandas as pd

# BUG: dtype parameter only accepts a single type, not a list
try:
    df = pd.DataFrame(
        index=['pbp'],
        columns=['contract', 'state', 'membership', 'raf'],
        dtype=['str', 'str', 'int', 'float']
    )
    print(df)
except TypeError as e:
    print(f"Crash: {e}")
