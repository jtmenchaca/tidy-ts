# ID: SO#19864028
# Language: Python
# Bug class: Value type
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: Column contains 'na' string alongside numbers, preventing float conversion. Mixed types.
# Reproduction status: Live
# Type system catch: `Record<string, number>` rejects string column

import pandas as pd

df = pd.DataFrame({
    'cap': ['5.2', 'na', '2.2', '7.6', '7.5', '3.0']
})

print(f"dtype: {df['cap'].dtype}")

try:
    df['cap'] = df['cap'].astype(float)
    print(df)
except ValueError as e:
    print(f"Crash: {e}")
