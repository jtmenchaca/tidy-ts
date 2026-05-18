# ID: SO#12588986
# Language: Python
# Bug class: Value type
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: Inplace add on numpy object array with float64 fails. Type conflict in arithmetic.
# Reproduction status: Fixed (numpy 2)
# Type system catch: Typed arithmetic rejects `object` dtype operands

import numpy as np

b = np.zeros(1)
c = np.zeros(1)
c = c / 2**63

print("b dtype:", b.dtype, "c dtype:", c.dtype)

try:
    b += c
except TypeError as e:
    print(f"Crash: {e}")
else:
    print("b += c succeeded (no TypeError on current numpy)")
