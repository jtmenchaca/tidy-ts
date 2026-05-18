# ID: SO#17151210
# Language: Python
# Bug class: Data loading
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: numpy loadtxt fails on header/comment rows. Non-numeric content in numeric load.
# Reproduction status: Live
# Type system catch: `Record<string, number>` rejects string column

import numpy as np
import tempfile
import os

# Create the CSV file matching the SO scenario
content = """# Comment 1
# Comment 2
x,y,z
1,2,3
4,5,6
7,8,9
"""

tmpfile = tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False)
tmpfile.write(content)
tmpfile.close()

# The SO bug: skiprows=1 only skips 1 line after comments, but the header
# row "x,y,z" is NOT a comment (no #), so it gets included in numeric parse
try:
    FH = np.loadtxt(tmpfile.name, comments='#', delimiter=',', skiprows=1)
    print("Unexpectedly succeeded")
except ValueError as e:
    print(f"Crash: ValueError: {e}")

print()

# The fix: skip the header row properly (skiprows=2 or filter non-comment headers)
with open(tmpfile.name) as f:
    lines = (line for line in f if not line.startswith('#'))
    FH = np.loadtxt(lines, delimiter=',', skiprows=1)
print("With proper header skipping:")
print(FH)

os.unlink(tmpfile.name)
