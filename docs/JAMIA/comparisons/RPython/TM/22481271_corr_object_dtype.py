# ID: SO#22481271
# Language: Python
# Bug class: Value type
# Runtime consequence: IF
# In study: Yes
# Inclusion rationale: corr() returns empty matrix on object-dtype columns. Numeric operation on string-typed data silently produces wrong result.
# Reproduction status: Live
# Type system catch: `Record<string, number>` rejects string column

import pandas as pd

# Columns are object dtype — values look numeric but aren't typed as such.
# This commonly happens through CSV loading, .T on mixed frames, or concat.
df = pd.DataFrame({
    "A": ["0.006", "-0.002", "0.010", "0.003", "0.002"],
    "B": ["-0.001", "-0.0005", "0.0003", "0.001", "-0.0002"],
    "C": ["0.003", "-0.002", "0.002", "-0.003", "0.002"],
})

print("dtypes:", df.dtypes.tolist())
print("Data looks numeric:")
print(df)
print()

# With numeric_only=True (the old default), silently returns empty
result = df.corr(numeric_only=True)
print("df.corr(numeric_only=True):")
print(result)
print()

# User expects a 3x3 matrix, gets nothing. No error, no warning.
# In a clinical pipeline, this would mean correlations silently missing
# from a report — the analysis appears complete but is empty.
