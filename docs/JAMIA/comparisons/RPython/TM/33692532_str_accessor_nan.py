# ID: SO#33692532
# Language: Python
# Bug class: Value type
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: .str accessor on column with NaN fails. Wrong accessor for column state (nullable).
# Reproduction status: Fixed (pandas 2.x handles NaN in .str accessor)
# Type system catch: Typed accessor rejects wrong column type

import pandas as pd
import numpy as np

df = pd.DataFrame({
    'data': ['100M', '5M', '75M', np.nan, '90M', None, '99M']
})

print(f"dtype: {df['data'].dtype}")
print(df)
print()

# On older pandas this crashes; on modern pandas .str works with NaN (returns NaN)
# Demonstrating the type confusion: column has mixed string/NaN
result = df['data'].str.extract(r'(\d+)')
print("After .str.extract (NaN rows become NaN):")
print(result)
