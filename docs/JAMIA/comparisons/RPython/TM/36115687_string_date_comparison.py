# ID: SO#36115687
# Language: Python
# Bug class: Value type
# Runtime consequence: IF
# In study: Yes
# Inclusion rationale: PySpark filtering dates stored as strings — comparison uses string ordering not date ordering. Silent wrong results.
# Reproduction status: Live
# Type system catch: `Temporal` rejects `string`

import pandas as pd

df = pd.DataFrame({
    'date': ['1/15/2015', '2/3/2015', '12/1/2014', '7/20/2015', '11/5/2015'],
    'value': [100, 200, 300, 400, 500],
})

# BUG: string comparison on non-ISO date format gives wrong ordering
cutoff = '6/30/2015'
filtered = df[df['date'] > cutoff]
print("String comparison result (WRONG):")
print(filtered)
print()
# "7/20/2015" > "6/30/2015" is True (correct by accident)
# But "12/1/2014" > "6/30/2015" is False (wrong — "1" < "6" lexicographically... actually correct)
# "11/5/2015" > "6/30/2015" is False (wrong — should be after June)
# The key issue: string ordering != date ordering for non-ISO formats
