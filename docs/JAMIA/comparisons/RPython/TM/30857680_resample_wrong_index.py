# ID: SO#30857680
# Language: Python
# Bug class: Value type
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: resample() requires DatetimeIndex, got integer index. Wrong index type for operation.
# Reproduction status: Live
# Type system catch: `resample()` requires `DatetimeIndex`; `RangeIndex` rejected

import pandas as pd

data = pd.DataFrame({
    'Price': [100.5, 101.2, 99.8, 102.0, 100.0],
    'Volume': [1000, 1500, 800, 2000, 1200],
    'Timestamp': pd.to_datetime(['2023-01-01 09:00', '2023-01-01 09:15',
                                  '2023-01-01 09:30', '2023-01-01 09:45',
                                  '2023-01-01 10:00'])
})

# BUG: resample on integer index crashes
try:
    bars = data.Price.resample('30min').ohlc()
    print(bars)
except TypeError as e:
    print(f"Crash: {e}")
