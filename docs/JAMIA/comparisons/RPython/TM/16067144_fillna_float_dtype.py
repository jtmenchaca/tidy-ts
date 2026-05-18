# ID: SO#16067144
# Language: Python
# Bug class: Value type
# Runtime consequence: DC
# In study: Yes
# Inclusion rationale: fillna on float column with string requires astype(object), silently converting all columns to object dtype.
# Reproduction status: Live
# Type system catch: `number` column rejects `string` fill value; no silent coercion to `object`

import io

import pandas as pd

csv = """a,a,,a
b,b,,b
c,c,,c"""

df = pd.read_csv(io.StringIO(csv), header=None)
print(df)
print(df.dtypes)
print()

# In [20]: df.fillna({2:'UNKNOWN'})
try:
    bad = df.fillna({2: "UNKNOWN"})
except ValueError as e:
    print(type(e).__name__ + ":", e)
else:
    print(bad)
    print(bad.dtypes)
print()

# >>> df.astype(object).fillna("UNKNOWN")
corrupted = df.astype(object).fillna("UNKNOWN")
print(corrupted)
print(corrupted.dtypes)
