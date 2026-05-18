# ID: SO#18401112
# Language: Python
# Bug class: Value type
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: String labels ('0','1') instead of int labels for roc_auc_score. Wrong type at data load.
# Reproduction status: Fixed (modern sklearn)
# Type system catch: `Record<string, number>` rejects string column

import numpy as np
from sklearn.metrics import roc_auc_score

y_scores = np.array([0.63, 0.53, 0.36, 0.02, 0.70, 1, 0.48, 0.46, 0.57])
y_true = np.array(['0', '1', '0', '0', '1', '1', '1', '1', '1'])  # strings, not ints

try:
    result = roc_auc_score(y_true, y_scores)
    print(f"Result: {result}")
except ValueError as e:
    print(f"Crash: {e}")

# Fix: use integer labels
y_true_int = np.array([0, 1, 0, 0, 1, 1, 1, 1, 1])
print(f"Fixed: {roc_auc_score(y_true_int, y_scores)}")
