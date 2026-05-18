# ID: SO#36115687
# Language: Python
# Bug class: Value type
# Runtime consequence: IF
# In study: Yes
# Inclusion rationale: PySpark filtering dates stored as strings — comparison uses string ordering not date ordering. Silent wrong results.
# Reproduction status: Live
# Type system catch: `Temporal` rejects `string`

import pandas as pd
from datetime import datetime, timedelta

df = pd.DataFrame({
    "date": [
        "2015-07-02T11:22:21.050Z",
        "2015-06-01T11:22:21.050Z",
        "2016-03-20T21:00:00.000Z",
    ],
})

# Date-only cutoff string (PySpark SO approach)
last_week = (datetime.today() - timedelta(days=7)).strftime("%Y-%m-%d")

# BUG: lexicographic compare of full ISO timestamps against YYYY-MM-DD
result = df[df["date"] >= last_week]
print("String compare (may disagree with true dates):")
print(result)

# e.g. '2016-03-20T21:00:00.000Z' >= '2026-05-09' is False as strings,
# while a parsed datetime comparison could differ for edge formats.
