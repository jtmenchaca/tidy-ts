# ID: SO#26614465
# Language: Python
# Bug class: Nullable
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: pd.notnull on list returns array, breaks if-condition. Null-check returns unexpected type.
# Reproduction status: Live
# Type system catch: Null check returns `boolean`, not `boolean[]`; typed narrowing

import pandas as pd
import numpy as np

df = pd.DataFrame({
    "A": ["one", "two", "three"],
    "C": [["foo", "bar"], np.nan, ["baz"]],
})

print("DataFrame:")
print(df)
print()

def my_func(row):
    print(f"  Processing: {row.tolist()}")

# The SO bug: pd.notnull on a list cell returns an array
print("pd.notnull on list cell:")
print(f"  pd.notnull(['foo', 'bar']) = {pd.notnull(['foo', 'bar'])}")
print(f"  Type: {type(pd.notnull(['foo', 'bar']))}")
print()

# This crashes because pd.notnull on list returns array, can't be used as bool
print("Attempting apply with notnull check:")
try:
    df[['A', 'C']].apply(
        lambda x: my_func(x) if pd.notnull(x.iloc[1]) else x, axis=1
    )
    print("Unexpectedly succeeded")
except ValueError as e:
    print(f"Crash: ValueError: {e}")

print()

# The fix: use np.all(pd.notnull(...))
print("With np.all fix:")
df[['A', 'C']].apply(
    lambda x: my_func(x) if np.all(pd.notnull(x.iloc[1])) else x, axis=1
)
