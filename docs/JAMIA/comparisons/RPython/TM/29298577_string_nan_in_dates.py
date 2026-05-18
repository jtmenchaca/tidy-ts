# ID: SO#29298577
# Language: Python
# Bug class: Data loading
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: String 'nan' in date column fails to_datetime. Mixed content at load boundary.
# Reproduction status: Live
# Type system catch: `Temporal` rejects `string`

import pandas as pd
import datetime as dt

df = pd.DataFrame({
    'Date': ['2014-10-20 10:44:31', '2014-10-23 09:33:46', 'nan', '2014-10-01 09:38:45']
})

try:
    df['Date'] = df['Date'].apply(lambda x: dt.datetime.strptime(x, '%Y-%m-%d %H:%M:%S'))
    print(df)
except ValueError as e:
    print(f"Crash: {e}")
