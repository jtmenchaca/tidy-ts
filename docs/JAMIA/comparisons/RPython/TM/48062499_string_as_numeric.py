# ID: SO#48062499
# Language: Python
# Bug class: Value type
# Runtime consequence: IF
# In study: Yes
# Inclusion rationale: Y-axis data plotted as strings, not sorted numerically. String where number expected. Data processing error visible in output.
# Reproduction status: Live
# Type system catch: `Record<string, number>` rejects string column

import numpy as np

# Simulates reading a CSV column without type parsing — values are strings
# (exact pattern from the SO question: line[1] from split CSV)
Solar = ["50.35", "41.01", "69.16", "94.5", "111.9",
         "103", "98.6", "36.45", "34.74", "34.17", "34.6"]

# argsort on string array — sorts lexicographically, not numerically
order = np.argsort(Solar)
sorted_solar = np.array(Solar)[order]
print("Sorted as strings (WRONG — silent):")
print(sorted_solar)
# ['103' '111.9' '34.17' '34.6' '34.74' '36.45' '41.01' '50.35' '69.16' '94.5' '98.6']
# "103" comes before "34" — this is lexicographic, not numeric.
# No error, no warning. The plot just looks wrong.
print()

# The fix: explicit type conversion
Solar_f = [float(x) for x in Solar]
order_f = np.argsort(Solar_f)
sorted_f = np.array(Solar_f)[order_f]
print("Sorted as floats (correct):")
print(sorted_f)
