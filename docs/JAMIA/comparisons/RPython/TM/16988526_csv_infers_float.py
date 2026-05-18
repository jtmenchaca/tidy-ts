# ID: SO#16988526
# Language: Python
# Bug class: Value type
# Runtime consequence: IF
# In study: Yes
# Inclusion rationale: CSV reader infers '1234E5' as float instead of string. Silent wrong type at load. Original bug fixed in pandas 0.11.1, but same class of bug reproduced with leading-zero identifiers ('007' → 7).
# Reproduction status: Variant (original 1234E5 fixed; reproduced with leading-zero '007' → 7)
# Type system catch: Explicit `string` column type prevents silent numeric coercion

import pandas as pd
import tempfile
import os

# IDs that are zero-padded strings — leading zeros are meaningful
csv_content = "id,value\n007,hello\n042,world\n100,foo\n"
path = tempfile.mktemp(suffix='.csv')
with open(path, 'w') as f:
    f.write(csv_content)

# BUG: pandas silently converts '007' to integer 7, losing the leading zero
df = pd.read_csv(path)
print("After read_csv (no dtype specified):")
print(df)
print(f"\nid dtype: {df['id'].dtype}")
print(f"First id value: {df['id'].iloc[0]} (type: {type(df['id'].iloc[0]).__name__})")
# '007' became 7 — silent data corruption of the identifier

os.unlink(path)
