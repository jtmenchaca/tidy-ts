# ID: SO#6063876
# Language: Python
# Bug class: Value type
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: Scatter colorbar needs float array, got tuple list. Type mismatch.
# Reproduction status: Fixed (matplotlib 3)
# Type system catch: Color parameter requires `number[]`; tuple list rejected

import matplotlib
matplotlib.use("Agg")
import matplotlib
import matplotlib.pyplot as plt

cm = matplotlib.colormaps["RdYlBu"]
colors = [cm(1.0 * i / 20) for i in range(20)]
xy = list(range(20))
plt.subplot(111)
colorlist = [colors[x // 2] for x in xy]
plt.scatter(xy, xy, c=colorlist, s=35, vmin=0, vmax=20)
plt.colorbar()
plt.close()
