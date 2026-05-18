# ID: SO#38969267
# Language: Python
# Bug class: Column ref
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: Selecting columns via list fails when column doesn't exist. Column reference error.
# Reproduction status: Fixed (pandas 3)
# Type system catch: Schema type tracks column presence; non-existent key rejected

import pandas as pd

df = pd.DataFrame({
    "a": [1, 2, 3],
    "b": [4, 5, 6],
    "c": [7, 8, 9],
})

# SO question used the variable name `list` for the column-name list
list = ["a", "b", "missing_col"]

try:
    df_new = df[[list]]
except TypeError as e:
    print(f"Crash (double brackets): {e}")
except KeyError as e:
    print(f"Crash (double brackets, pandas 3.x): {e}")

try:
    df_new = df[list]
except KeyError as e:
    print(f"Crash (missing column): {e}")
