# ID: SO#26788854
# Language: Python
# Bug class: Value type
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: Date string "03011979" used in datetime arithmetic. String where temporal type expected.
# Reproduction status: Live
# Type system catch: `Temporal` rejects `string`

import pandas as pd
from datetime import datetime

df = pd.DataFrame({
    'name': ['DOE', 'BOURNE', 'GRINCH'],
    'dob': ['03011979', '06111978', '12131988'],
})

now = datetime.now()

try:
    df['age'] = now - df['dob']
    print(df)
except TypeError as e:
    print(f"Crash: {e}")
