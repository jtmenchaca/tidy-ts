# ID: SO#48719937
# Language: Python
# Bug class: Value type
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: idxmax() on object-dtype column fails. Numeric reduction on wrong type.
# Reproduction status: Fixed (pandas 2.x handles object-dtype idxmax)
# Type system catch: `number` column type required for numeric reductions

import pandas as pd
import numpy as np

# Simulate the bug: DataFrame with object-dtype numeric column
c_params = [0.01, 0.1, 1, 10, 100]
results = pd.DataFrame(index=range(len(c_params), 2), columns=['C_parameter', 'Mean recall score'])
results['C_parameter'] = c_params

# Assign recall scores as computed values
recall_scores = [0.95, 0.90, 0.92, 0.92, 0.92]
for j, score in enumerate(recall_scores):
    results.iloc[j, 1] = score

print(f"dtype of 'Mean recall score': {results['Mean recall score'].dtype}")
print(results)
print()

try:
    best = results.loc[results['Mean recall score'].idxmax()]['C_parameter']
    print(f"Best: {best}")
except TypeError as e:
    print(f"Crash: {e}")
