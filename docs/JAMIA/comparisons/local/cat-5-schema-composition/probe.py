"""Probe: Category 5 — Schema Composition Errors in Python/pandas

Consolidates error classes 06, 13, 20, 27, 33.
"""
import json
import pandas as pd
import numpy as np
import warnings
import os
import tempfile

os.chdir(os.path.dirname(os.path.abspath(__file__)))
results = []

# ═══════════════════════════════════════════════════════════════════════════════
# Schema validation at data boundaries
# ═══════════════════════════════════════════════════════════════════════════════

# a: Non-numeric value in numeric column
csv_bad_type = "lab_id,result_value\nL1,100\nL2,pending\nL3,200\n"
with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as f:
    f.write(csv_bad_type)
    tmp_path = f.name

with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    try:
        df = pd.read_csv(tmp_path)
        dtype = str(df["result_value"].dtype)
        if dtype == "object":
            results.append({"outcome": "silent", "message": f"column dtype became '{dtype}' — mixed types, no error", "result": "dtype silently became object"})
        elif w:
            results.append({"outcome": "warning", "message": str(w[0].message), "result": f"dtype became {dtype}"})
        else:
            results.append({"outcome": "silent", "message": f"loaded as {dtype}", "result": "mixed types silently accepted"})
    except Exception as e:
        results.append({"outcome": "error", "message": str(e), "result": None})

os.unlink(tmp_path)

# b: Missing column — accessed after load
try:
    df = pd.read_csv("../../fixtures/lab_results.csv")
    val = df["nonexistent_column"]
    results.append({"outcome": "silent", "message": "accessed without error", "result": None})
except KeyError as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# c: Empty cell in column that should be non-null
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    try:
        df = pd.read_csv("../../fixtures/lab_results.csv")
        nan_count = int(df["reference_high"].isna().sum())
        if w:
            results.append({"outcome": "warning", "message": str(w[0].message), "result": f"{nan_count} cells silently became NaN"})
        else:
            results.append({"outcome": "silent", "message": f"empty cells became NaN silently (count={nan_count})", "result": f"{nan_count} cells silently became NaN"})
    except Exception as e:
        results.append({"outcome": "error", "message": str(e), "result": None})

# ═══════════════════════════════════════════════════════════════════════════════
# Bind rows schema mismatch
# ═══════════════════════════════════════════════════════════════════════════════

labs_a = pd.DataFrame({
    "patient_id": ["P001", "P002"],
    "test_name": ["BNP", "WBC"],
    "result_value": [1250, 15.2],
    "lab_site": ["Main", "Main"],
})

labs_b = pd.DataFrame({
    "patient_id": ["P003", "P004"],
    "test_name": ["HbA1c", "Glucose"],
    "result_value": [8.9, 210],
    "reference_range": ["4.0-5.6", "70-100"],
})

# d: concat with different schemas — fills NaN silently
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    try:
        combined = pd.concat([labs_a, labs_b], ignore_index=True)
        nan_in_lab_site = int(combined["lab_site"].isna().sum())
        nan_in_ref_range = int(combined["reference_range"].isna().sum())
        if w:
            results.append({"outcome": "warning", "message": str(w[0].message), "result": None})
        else:
            results.append({"outcome": "silent", "message": f"missing cols filled with NaN: lab_site={nan_in_lab_site}, reference_range={nan_in_ref_range}", "result": "NaN-filled 2 missing cols"})
    except Exception as e:
        results.append({"outcome": "error", "message": str(e), "result": None})

# e: String op on NaN column after concat — silent propagation
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    try:
        combined["site_upper"] = combined["lab_site"].str.upper()
        nan_count = int(combined["site_upper"].isna().sum())
        if w:
            results.append({"outcome": "warning", "message": str(w[0].message), "result": None})
        else:
            results.append({"outcome": "silent", "message": f"NaN propagated in str.upper(): {nan_count} NaN rows", "result": "NaN propagated to 2 rows"})
    except Exception as e:
        results.append({"outcome": "error", "message": str(e), "result": None})

# ═══════════════════════════════════════════════════════════════════════════════
# Implicit type coercion in row binding
# ═══════════════════════════════════════════════════════════════════════════════

numeric_doses = pd.DataFrame({
    "drug": ["Aspirin", "Lisinopril"],
    "dose": [325, 10],
})

text_doses = pd.DataFrame({
    "drug": ["Insulin", "Warfarin"],
    "dose": ["sliding scale", "per INR"],
})

# f: concat silently coerces dose from int64 to object
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    combined_doses = pd.concat([numeric_doses, text_doses], ignore_index=True)
    dtype = str(combined_doses["dose"].dtype)
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": dtype})
    else:
        results.append({"outcome": "silent", "message": f"concat coerced dose to '{dtype}' silently", "result": f"coerced to '{dtype}' dtype"})

# g: Arithmetic on mixed-type column — string repetition instead of multiplication
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    combined_doses["doubled"] = combined_doses["dose"] * 2
    val = combined_doses.loc[combined_doses["drug"] == "Insulin", "doubled"].iloc[0]
    is_repeated = val == "sliding scalesliding scale"
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": is_repeated})
    else:
        results.append({"outcome": "silent", "message": f"'dose' * 2 repeated strings instead of multiplying: {is_repeated}", "result": "strings repeated, not math"})

# ═══════════════════════════════════════════════════════════════════════════════
# Append row type mismatch
# ═══════════════════════════════════════════════════════════════════════════════

patients = pd.DataFrame({
    "patient_id": ["P001"],
    "name": ["Alice"],
    "age": [30],
})

# h: Missing column silently filled with NaN
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    new_row = pd.DataFrame({"patient_id": ["P002"], "name": ["Bob"]})
    combined_patients = pd.concat([patients, new_row], ignore_index=True)
    has_nan = bool(combined_patients["age"].isna().any())
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": "Missing col filled with NaN"})
    else:
        results.append({"outcome": "silent", "message": f"missing column silently filled with NaN: {has_nan}", "result": "Missing col filled with NaN"})

# i: Wrong type silently coerced
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    bad_row = pd.DataFrame({"patient_id": ["P003"], "name": ["Carol"], "age": ["thirty"]})
    combined2 = pd.concat([patients, bad_row], ignore_index=True)
    dtype = str(combined2["age"].dtype)
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": "Age dtype coerced to object"})
    else:
        results.append({"outcome": "silent", "message": f"wrong type coerced age to '{dtype}'", "result": "Age dtype coerced to object"})

# ═══════════════════════════════════════════════════════════════════════════════
# Duplicate column names
# ═══════════════════════════════════════════════════════════════════════════════

# j: Create df with duplicate "name" columns, then .str.upper()
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    try:
        df = pd.DataFrame([[1, "Alice", "ED"]], columns=["id", "name", "name"])
        upper = df["name"].str.upper()
        results.append({"outcome": "silent", "message": f"str.upper() returned {type(upper).__name__}", "result": str(upper)})
    except Exception as e:
        results.append({"outcome": "error", "message": str(e), "result": "str.upper() failed on duplicate col"})

print(json.dumps(results))
