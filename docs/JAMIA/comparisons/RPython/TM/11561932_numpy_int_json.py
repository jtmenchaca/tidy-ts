# ID: SO#11561932
# Language: Python
# Bug class: Value type
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: numpy int32 in list not JSON serializable. Same native type pattern.
# Reproduction status: Live
# Type system catch: Native JS types; no int64/int32 wrapper

import json
import numpy as np

arr = np.arange(5)

# list() keeps numpy int64 scalars
try:
    json.dumps(list(arr))
    print("list() serialized OK")
except TypeError as e:
    print(f"Crash with list(): {e}")

# .tolist() converts to native Python ints
print(f"tolist() works: {json.dumps(arr.tolist())}")
