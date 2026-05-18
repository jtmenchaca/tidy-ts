# ID: SO#5957380
# Language: Python
# Bug class: Value type
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: Structured array to regular ndarray conversion fails. Type conversion error.
# Reproduction status: Live
# Type system catch: Structured dtype fields must match target array type

import numpy as np

data = np.array(
    [
        (0.01479368, 0.00668112, 0.0, 0.0, 0.0, 0.00089849, 0.0, 0.01347553, 0.0, 0.0),
        (0.01479368, 0.00668112, 0.0, 0.0, 0.0, 0.00089849, 0.0, 0.01347553, 0.0, 0.0),
    ],
    dtype=[
        ("a_soil", "<f4"), ("b_soil", "<f4"), ("Ea_V", "<f4"), ("Kcc", "<f4"),
        ("Koc", "<f4"), ("Lmax", "<f4"), ("malfarquhar", "<f4"), ("MRN", "<f4"),
        ("TCc", "<f4"), ("Vcmax_3", "<f4"),
    ],
)

# Wrong dtype in view — misaligned read; values are not the structured fields
data_array = data.view(np.float64).reshape(data.shape + (-1,))
print("view(float64) result (garbage on numpy 2.4.5):")
print(data_array)

correct = np.column_stack([data["a_soil"], data["b_soil"]])
print("correct column_stack:")
print(correct)
