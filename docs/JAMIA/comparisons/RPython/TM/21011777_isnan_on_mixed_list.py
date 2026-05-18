# ID: SO#21011777
# Language: Python
# Bug class: Value type
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: NaN mixed into list prevents clean removal — math.isnan fails on non-float elements. Mixed types.
# Reproduction status: Live
# Type system catch: `number | null` typed column; `isNaN` rejects non-number elements

import math
import numpy as np

countries = [float('nan'), 'USA', 'UK', 'France']

# BUG: math.isnan fails on string elements
try:
    cleaned = [x for x in countries if not math.isnan(x)]
    print(cleaned)
except TypeError as e:
    print(f"Crash (math.isnan): {e}")

# BUG: np.isnan also fails on mixed types
try:
    mask = np.isnan(countries)
    print(mask)
except TypeError as e:
    print(f"Crash (np.isnan): {e}")
