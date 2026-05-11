"""
Error Class 24: Window Function Output Type

Python's shift() silently introduces NaN for shifted positions.
Arithmetic on the shifted result propagates NaN without warning.
"""
import pandas as pd

values = pd.Series([100, 200, 300, 400])

# SILENT: shift() introduces NaN at the start
lagged = values.shift(1)
print(lagged)  # [NaN, 100, 200, 300]

# SILENT: Arithmetic on NaN propagates — no error, no warning
diff = lagged - values
print(diff)  # [NaN, -100, -100, -100] — first element is NaN
