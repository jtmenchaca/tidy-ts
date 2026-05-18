# ID: SO#31521526
# Language: Python
# Bug class: Value type
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: Currency string "(1,234.56)" can't convert to float. String format vs numeric type.
# Reproduction status: Live
# Type system catch: `Record<string, number>` rejects string column

import pandas as pd

df = pd.DataFrame({'Currency': ['$1.00', '$2,000.00', '(3,000.00)']})

try:
    df['Currency'] = df['Currency'].replace(r'[\$,]', '', regex=True).astype(float)
    print(df)
except ValueError as e:
    print(f"Crash: {e}")
