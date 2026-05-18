# ID: SO#4231190
# Language: Python
# Bug class: Value type
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: numpy array of tuples needs structured dtype. Type specification error.
# Reproduction status: Live
# Type system catch: `number[][]` required for linear algebra; `object` array rejected

import numpy as np

ph, pw = 3, 3
anArray = np.zeros((ph, pw), dtype="O")
for h in range(ph):
    for w in range(pw):
        anArray[h][w] = (float(h), float(w), 1.0)

np.linalg.svd(anArray)
