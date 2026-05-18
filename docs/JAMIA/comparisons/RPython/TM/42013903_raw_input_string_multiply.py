# ID: SO#42013903
# Language: Python
# Bug class: Value type
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: raw_input returns string, used in numpy multiply. String where number expected.
# Reproduction status: Live
# Type system catch: `number` parameter rejects `string` in arithmetic

import numpy as np

x = np.linspace(0., 9., 10)

# Simulating raw_input which returns strings
a = "9.8"  # raw_input('Acceleration =')
v = "5.0"  # raw_input('Velocity = ')

# BUG: string * numpy array crashes
try:
    y = v * x - 0.5 * a * x**2
except TypeError as e:
    print(f"Crash: {e}")

# Fix: explicit conversion
a_num = float(a)
v_num = float(v)
y = v_num * x - 0.5 * a_num * x**2
print(f"Fixed: {y[:3]}")
