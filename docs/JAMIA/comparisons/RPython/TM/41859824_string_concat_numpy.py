# ID: SO#41859824
# Language: Python
# Bug class: Value type
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: String concatenation with numpy numeric types fails. Arithmetic on wrong type. Original 'add' bug fixed in modern numpy; reproduced with 'multiply' variant which still crashes.
# Reproduction status: Live
# Type system catch: `number` parameter rejects `string` in arithmetic

import numpy as np

# String values in numpy array — arithmetic operators dispatch to ufuncs
vals = np.array(['5.0', '9.8'])
x = np.linspace(0., 9., 10)

# BUG: string * numpy float array crashes (ufunc 'multiply' doesn't support string)
try:
    y = vals[0] * x
except TypeError as e:
    print(f"Crash: {e}")
    # ufunc 'multiply' did not contain a loop with signature matching types (dtype('<U3'), dtype('float64')) -> None
