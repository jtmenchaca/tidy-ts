# ID: SO#14992644
# Language: Python
# Bug class: Value type
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: Histogram on string DataFrame columns fails. Numeric operation on string data.
# Reproduction status: Live
# Type system catch: `Record<string, number>` rejects string column

import pandas as pd
import numpy as np

df = pd.DataFrame({
    's1': ['a', 'b', 'a', 'c', 'a', 'b'],
    's2': ['a', 'f', 'a', 'd', 'a', 'f'],
})

# BUG: np.histogram requires numeric data
try:
    counts, bins = np.histogram(df['s1'].values)
    print(counts)
except (TypeError, ValueError) as e:
    print(f"Crash: {e}")
