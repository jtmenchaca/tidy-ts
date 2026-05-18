# ID: SO#27413843
# Language: Python
# Bug class: Data loading
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: read_table fails with wrong separator — loads as single column. Schema mismatch at load.
# Reproduction status: Live
# Type system catch: `Record<string, number>` rejects string column

import pandas as pd
import tempfile
import os

# Create a temporary .dat file matching the SO scenario
content = """Investment Data
17.749000   0.66007000    0.15122000   0.33150000
3.9480000   0.52889000    0.11523000   0.56233000
14.810000    3.7480300    0.57099000   0.12111000
"""

tmpfile = tempfile.NamedTemporaryFile(mode='w', suffix='.dat', delete=False)
tmpfile.write(content)
tmpfile.close()

# The SO bug: using sep="" crashes
try:
    df = pd.read_table(tmpfile.name, skiprows=[0], sep="")
    print("Unexpectedly succeeded")
except Exception as e:
    print(f"Crash with sep='': {type(e).__name__}: {e}")

print()

# The fix: use proper whitespace separator
df = pd.read_csv(tmpfile.name, sep=r'\s+', header=None, skiprows=1)
print("With correct sep='\\s+':")
print(df)
print(f"dtypes: {df.dtypes.tolist()}")

os.unlink(tmpfile.name)
