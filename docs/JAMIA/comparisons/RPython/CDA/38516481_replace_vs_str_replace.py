"""
RPython SO#38516481 — Series.replace() silently does nothing on substrings
Effect: IF (silent incorrect functionality)

pandas Series.replace(',', '') does VALUE-level replacement (looking for cells
that are exactly ','). It does NOT do substring replacement within cells.
The column is unchanged — no error, no warning. You need .str.replace() instead.
"""
import pandas as pd

df = pd.DataFrame({
    'Player': ['Mike Trout', 'Clayton Kershaw', 'Bryce Harper'],
    'Avg_Annual': ['$34,083,333', '$31,000,000', '$25,538,462'],
})

# BUG: .replace() silently does nothing — looks for exact cell match
df['Avg_Annual'] = df['Avg_Annual'].replace(',', '')
df['Avg_Annual'] = df['Avg_Annual'].replace('$', '')

print("After .replace() — UNCHANGED (silent failure):")
print(df['Avg_Annual'].tolist())
# ['$34,083,333', '$31,000,000', '$25,538,462']
# No error. User thinks they cleaned the data. They didn't.
print()

# Correct: .str.replace() for substring operations
df['Avg_Annual'] = df['Avg_Annual'].str.replace(',', '', regex=False)
df['Avg_Annual'] = df['Avg_Annual'].str.replace('$', '', regex=False)
print("After .str.replace() — correct:")
print(df['Avg_Annual'].tolist())
