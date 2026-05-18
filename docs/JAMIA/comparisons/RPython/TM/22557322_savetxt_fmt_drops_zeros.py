# ID: SO#22557322
# Language: Python
# Bug class: Value type
# Runtime consequence: IF
# In study: Yes
# Inclusion rationale: numpy savetxt fmt='%i' on float array silently drops zeroes. Format/type mismatch produces wrong output.
# Reproduction status: Fixed (modern numpy)
# Type system catch: Format specifier `%i` rejects `float` array at type level

import numpy as np
import io

result = np.array([
    [1.0, 2.0],
    [2.0, 0.0],
    [3.0, 9.0],
    [4.0, 0.0],
    [5.0, 3.0],
])

buf = io.BytesIO()
np.savetxt(buf, result, fmt='%i', delimiter=',')
output = buf.getvalue().decode()
print("Output with fmt='%i':")
print(output)
# Note: zero values appear as "0" which is correct on modern numpy,
# but the original bug had them disappear entirely
