"""
RPython SO#42719749 — Pandas convert string to int
Effect: DC (silent data corruption)

pd.to_numeric(errors='coerce') silently converts unparseable strings to NaN,
then fillna(0).astype(int) turns them into 0. The user loses data without
any indication of which rows were corrupted.
"""
import pandas as pd
import numpy as np

df = pd.DataFrame({
    'ID': ['4806105017087', '4806105017087', '4901295030089', 'CN414149', '4901295030089']
})

# BUG: errors='coerce' silently turns bad values into NaN → 0
df['ID'] = pd.to_numeric(df['ID'], errors='coerce').fillna(0).astype(np.int64)

print("After to_numeric with coerce:")
print(df['ID'].tolist())
# [4806105017087, 4806105017087, 4901295030089, 0, 4901295030089]
# Row 3 silently became 0 — no error, no warning about data loss
