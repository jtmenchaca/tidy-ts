# ID: SO#22137723
# Language: Python
# Bug class: Data loading
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: Number strings with commas fail conversion. Data format vs expected type at load.
# Reproduction status: Live
# Type system catch: `Record<string, number>` rejects string column

import pandas as pd

df = pd.DataFrame({'amount': ['1,200', '4,200', '7,000', '-0.03', '5', '0']})

print(f"dtype: {df['amount'].dtype}")

# BUG: can't convert comma-separated number strings directly
try:
    df['amount'].astype(float)
except ValueError as e:
    print(f"Crash: {e}")

# Fix: remove commas first
df['amount'] = df['amount'].str.replace(',', '', regex=False).astype(float)
print(f"\nFixed:")
print(df)
