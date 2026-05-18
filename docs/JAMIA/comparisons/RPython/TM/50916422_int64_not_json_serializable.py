# ID: SO#50916422
# Language: Python
# Bug class: Value type
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: numpy int64 extracted from DataFrame not JSON serializable. Tidy-ts values are native JS types.
# Reproduction status: Live
# Type system catch: Native JS types; no int64/int32 wrapper

import pandas as pd
import json

df = pd.DataFrame({'store': ['A', 'B', 'C'], 'count': [10, 12, 5]})

record = {'name': df['store'].iloc[0], 'count': df['count'].iloc[0]}
print(f"count type: {type(record['count'])}")

try:
    json.dumps(record)
    print("Serialized OK")
except TypeError as e:
    print(f"Crash: {e}")
