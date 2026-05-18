# ID: SO#33221655
# Language: Python
# Bug class: Value type
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: Setting list value in float64 column fails. Type mismatch on assignment.
# Reproduction status: Live
# Type system catch: `number` column rejects `number[]` assignment

import pandas as pd

output = pd.DataFrame(data=[[800.0]], columns=['Sold Count'], index=['Project1'])
print(output)

# BUG: assigning a list to a scalar cell
try:
    output.loc['Project1', 'Sold Count'] = [400.0]
    print(output)
except (ValueError, TypeError) as e:
    print(f"Crash: {e}")
