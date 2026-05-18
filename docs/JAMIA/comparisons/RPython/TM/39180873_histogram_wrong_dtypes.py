# ID: SO#39180873
# Language: Python
# Bug class: Value type
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: Histogram on DataFrame with wrong dtypes. Numeric operation on non-numeric.
# Reproduction status: Fixed (pandas 2.x+ handles object-dtype in hist)
# Type system catch: `number` column type required for histogram; `object` rejected

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

x_train = np.array(
    [
        ["0", "0", "0", "0", "0", "0"],
        ["1", "1", "0", "0", "0", "0"],
        ["0", "0", "0", "0", "0", "0"],
    ],
    dtype=object,
)

names = ["buying", "maint", "doors", "persons", "lug_boot", "safety"]
custom = pd.DataFrame(x_train)
custom.columns = names

print("dtypes:", custom.dtypes.tolist())

custom.hist()
plt.close()
