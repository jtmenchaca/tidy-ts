# ID: SO#28393103
# Language: Python
# Bug class: Value type
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: "cannot perform reduce with flexible type" — numeric reduction on object-dtype array.
# Reproduction status: Live
# Type system catch: `Record<string, number>` rejects string column

import numpy as np

# Simulate: data loaded as strings (common when reading CSV without dtype)
trainData = np.array([
    ['-214', '-153', '-58', '36', '191'],
    ['-139', '-73', '-1', '11', '76'],
    ['-76', '-49', '-307', '41', '228'],
])

print(f"dtype: {trainData.dtype}")

try:
    result = np.mean(trainData, axis=0)
    print(f"mean: {result}")
except TypeError as e:
    print(f"Crash: {e}")
