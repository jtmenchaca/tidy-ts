# ID: SO#31162780
# Language: Python
# Bug class: Value type
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: matplotlib Rectangle with datetime needs float conversion. Type mismatch at API boundary.
# Reproduction status: Fixed (matplotlib 3)
# Type system catch: `Temporal` rejects `string`

import matplotlib
matplotlib.use("Agg")
from datetime import datetime, timedelta
from matplotlib.patches import Rectangle
import matplotlib.pyplot as plt

fig = plt.figure()
ax = fig.add_subplot(111)

startTime = datetime.now()
width = timedelta(seconds=1)
endTime = startTime + width
rect = Rectangle((startTime, 0), width, 1, color="yellow")

try:
    ax.add_patch(rect)
except TypeError as e:
    print(f"Crash: {e}")

plt.xlim([startTime, endTime])
plt.ylim([0, 1])
plt.close()
