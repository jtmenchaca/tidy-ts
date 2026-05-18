# ID: SO#31745509
# Language: Python
# Bug class: Nullable
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: str.contains on nullable column returns NaN, bitwise NOT fails on NaN. Missing values break operations.
# Reproduction status: Fixed (pandas 2.x handles nullable StringDtype)
# Type system catch: `number` rejects `number | null`

import pandas as pd
import numpy as np

df = pd.DataFrame({
    'V': ['File corruption', 'Registry error', np.nan, 'File missing', 'Other issue'],
})

# BUG: str.contains returns NaN for null rows, ~ fails on NaN
try:
    result = df[~df['V'].str.contains("File|Registry", na=False)]
    # With na=False it works — but without it:
    mask = df['V'].str.contains("File|Registry")
    print(f"mask with NaN: {mask.tolist()}")
    filtered = df[~mask]  # This crashes due to NaN in mask
    print(filtered)
except (TypeError, ValueError) as e:
    print(f"Crash: {e}")
