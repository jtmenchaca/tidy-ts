# ID: SO#56079650
# Language: Python
# Bug class: Value type
# Runtime consequence: DC
# In study: Yes
# Inclusion rationale: Boolean column silently coerced to object dtype. Bitwise NOT (~) then gives wrong results instead of error. Silent data corruption.
# Reproduction status: Live
# Type system catch: `boolean` column type preserved; no silent coercion to `object`

import pandas as pd

a = pd.Series(['a', 'a', 'a', 'a', 'b', 'a', 'b', 'b', 'b', 'b'])
b = pd.Series([True, True, True, True, True, False, False, False, False, False], dtype=bool)

# Constructing via rows + transpose coerces bool to object
c = pd.DataFrame(data=[a, b]).T
c.columns = ['Classification', 'Boolean']

# This silently gives WRONG results — integers instead of booleans
print(~c.Boolean)
# 0    -2
# 1    -2
# 2    -2
# 3    -2
# 4    -2
# 5    -1
# ...

# User expects: False, False, False, False, False, True, True, True, True, True
# Gets: -2, -2, -2, -2, -2, -1, -1, -1, -1, -1
# Filtering with this produces WRONG rows — silent data corruption.
