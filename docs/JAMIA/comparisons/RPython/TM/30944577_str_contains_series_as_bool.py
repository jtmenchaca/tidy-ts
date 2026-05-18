# ID: SO#30944577
# Language: Python
# Bug class: Value type
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: str.contains returns Series used as scalar bool. Typed filter operates on values, returns boolean.
# Reproduction status: Live
# Type system catch: Typed accessor rejects wrong column type

import pandas as pd

df = pd.DataFrame({
    'Names': ['Bob', 'Jessica', 'Mary', 'John', 'Mel'],
    'Births': [968, 155, 77, 578, 973],
})

# BUG: str.contains returns Series, not scalar bool
try:
    if df['Names'].str.contains('Mel'):
        print("Mel is there")
except ValueError as e:
    print(f"Crash: {e}")
