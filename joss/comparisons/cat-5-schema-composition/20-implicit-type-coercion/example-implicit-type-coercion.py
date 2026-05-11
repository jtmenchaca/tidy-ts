"""
Error Class 20: Implicit Type Coercion in Row Binding

When concatenating DataFrames where the same column has different types,
pandas silently coerces to 'object' dtype. Subsequent numeric operations
fail silently or produce errors only at runtime.
"""
import pandas as pd

numeric_doses = pd.DataFrame({
    "drug": ["Aspirin", "Lisinopril"],
    "dose": [325, 10],
})

text_doses = pd.DataFrame({
    "drug": ["Insulin", "Warfarin"],
    "dose": ["sliding scale", "per INR"],
})

# SILENT: concat coerces 'dose' from int64 to object — no warning
combined = pd.concat([numeric_doses, text_doses], ignore_index=True)
print(f"dose dtype: {combined['dose'].dtype}")  # object

# SILENT: Arithmetic on mixed-type column
# combined["doubled"] = combined["dose"] * 2
# This would produce: 650, 20, "sliding scalesliding scale", "per INRper INR"
# String repetition instead of multiplication — silently wrong
