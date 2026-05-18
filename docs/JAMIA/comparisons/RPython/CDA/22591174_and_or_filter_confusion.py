"""
RPython SO#22591174 — pandas: multiple conditions while indexing - unexpected behavior
Effect: IF (silent incorrect functionality)

Users expect `|` to mean "drop rows matching ANY condition" but pandas boolean
indexing with `|` keeps rows matching ANY condition. The operator semantics are
correct but confusing — no error when logic is inverted.
"""
import pandas as pd

df = pd.DataFrame({'a': [0, -1, 2, -1, 4], 'b': [0, -1, 2, 3, -1]})

print("Original:")
print(df)
print()

# User wants to drop rows where EITHER column is -1
# BUG: uses | thinking "drop if a == -1 OR b == -1"
# Actually keeps rows where a != -1 OR b != -1 (i.e., only drops if BOTH are -1)
df_wrong = df[(df.a != -1) | (df.b != -1)]

print("Using | (user thinks: drop any -1, actually: keep if either != -1):")
print(df_wrong)
print()

# Correct: use & to require BOTH conditions
df_correct = df[(df.a != -1) & (df.b != -1)]
print("Using & (correct: keep only rows where both != -1):")
print(df_correct)
