# ID: SO#41286569
# Language: Python
# Bug class: Value type
# Runtime consequence: DC
# In study: Yes
# Inclusion rationale: df.sum() on object-dtype column concatenates strings instead of adding numbers. Numeric op on wrong type.
# Reproduction status: Live
# Type system catch: `number` column type prevents string concatenation in `sum()`

import pandas as pd

df = pd.DataFrame({
    'X': ['A', 'B', 'C', 'D'],
    'MyColumn': ['84', '76', '28', '19'],  # strings, not ints
    'Y': [13.0, 77.0, 69.0, 20.0],
})

print(f"MyColumn dtype: {df['MyColumn'].dtype}")
print(f"sum() result: {df['MyColumn'].sum()}")
# Returns '84762819' — string concatenation, not numeric sum
