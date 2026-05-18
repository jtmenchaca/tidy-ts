# ID: SO#15799162
# Language: Python
# Bug class: Value type
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: Resampling requires DatetimeIndex, got MultiIndex with dates. Wrong index type.
# Reproduction status: Live
# Type system catch: `resample()` requires `DatetimeIndex`; `MultiIndex` rejected

import pandas as pd
import numpy as np

dates = pd.date_range('2012-01-01', periods=4, freq='D')
states = ['Georgia', 'Georgia', 'Alabama', 'Alabama']
cities = ['Atlanta', 'Savannah', 'Mobile', 'Montgomery']

arrays = []
for state, city in zip(states, cities):
    for date in dates:
        arrays.append((state, city, date))

index = pd.MultiIndex.from_tuples(arrays, names=['State', 'City', 'Date'])
df = pd.DataFrame({'value_a': np.arange(16), 'value_b': np.arange(16) + 10}, index=index)

# BUG: resample on MultiIndex where Date is not outermost level
try:
    result = df.resample('2D').sum()
    print(result)
except (TypeError, ValueError) as e:
    print(f"Crash: {e}")
