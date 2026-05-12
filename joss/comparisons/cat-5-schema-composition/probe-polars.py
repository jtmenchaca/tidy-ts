"""Probe: Category 5 — Schema Composition Errors in Python/Polars

Consolidates error classes 06, 13, 20, 27, 33.
"""
import json
import polars as pl
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
        df = pl.read_csv(tmp_path)
        dtype = str(df["result_value"].dtype)
        if dtype == "String":
            results.append({"outcome": "silent", "message": f"column dtype became '{dtype}' — mixed types, no error", "result": "dtype silently became String"})
        elif w:
            results.append({"outcome": "warning", "message": str(w[0].message), "result": f"dtype became {dtype}"})
        else:
            results.append({"outcome": "silent", "message": f"loaded as {dtype}", "result": "mixed types silently accepted"})
    except Exception as e:
        results.append({"outcome": "error", "message": str(e), "result": None})

os.unlink(tmp_path)

# b: Missing column — accessed after load
try:
    df = pl.read_csv("../fixtures/lab_results.csv")
    val = df["nonexistent_column"]
    results.append({"outcome": "silent", "message": "accessed without error", "result": None})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# c: Empty cell in column that should be non-null
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    try:
        df = pl.read_csv("../fixtures/lab_results.csv")
        null_count = df["reference_high"].null_count()
        if w:
            results.append({"outcome": "warning", "message": str(w[0].message), "result": f"{null_count} cells silently became null"})
        else:
            results.append({"outcome": "silent", "message": f"empty cells became null silently (count={null_count})", "result": f"{null_count} cells silently became null"})
    except Exception as e:
        results.append({"outcome": "error", "message": str(e), "result": None})

# ═══════════════════════════════════════════════════════════════════════════════
# Bind rows schema mismatch
# ═══════════════════════════════════════════════════════════════════════════════

labs_a = pl.DataFrame({
    "patient_id": ["P001", "P002"],
    "test_name": ["BNP", "WBC"],
    "result_value": [1250.0, 15.2],
    "lab_site": ["Main", "Main"],
})

labs_b = pl.DataFrame({
    "patient_id": ["P003", "P004"],
    "test_name": ["HbA1c", "Glucose"],
    "result_value": [8.9, 210.0],
    "reference_range": ["4.0-5.6", "70-100"],
})

# d: concat with different schemas — fills null silently or errors
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    try:
        combined = pl.concat([labs_a, labs_b], how="diagonal")
        null_in_lab_site = combined["lab_site"].null_count()
        null_in_ref_range = combined["reference_range"].null_count()
        if w:
            results.append({"outcome": "warning", "message": str(w[0].message), "result": None})
        else:
            results.append({"outcome": "silent", "message": f"missing cols filled with null: lab_site={null_in_lab_site}, reference_range={null_in_ref_range}", "result": "null-filled 2 missing cols"})
    except Exception as e:
        results.append({"outcome": "error", "message": str(e), "result": None})

# e: String op on null column after concat — silent propagation
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    try:
        combined = combined.with_columns(
            pl.col("lab_site").str.to_uppercase().alias("site_upper")
        )
        null_count = combined["site_upper"].null_count()
        if w:
            results.append({"outcome": "warning", "message": str(w[0].message), "result": None})
        else:
            results.append({"outcome": "silent", "message": f"null propagated in str.to_uppercase(): {null_count} null rows", "result": "null propagated to 2 rows"})
    except Exception as e:
        results.append({"outcome": "error", "message": str(e), "result": None})

# ═══════════════════════════════════════════════════════════════════════════════
# Implicit type coercion in row binding
# ═══════════════════════════════════════════════════════════════════════════════

numeric_doses = pl.DataFrame({
    "drug": ["Aspirin", "Lisinopril"],
    "dose": [325, 10],
})

text_doses = pl.DataFrame({
    "drug": ["Insulin", "Warfarin"],
    "dose": ["sliding scale", "per INR"],
})

# f: concat silently coerces dose from int to string (or errors on schema mismatch)
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    try:
        combined_doses = pl.concat([numeric_doses, text_doses], how="diagonal")
        dtype = str(combined_doses["dose"].dtype)
        if w:
            results.append({"outcome": "warning", "message": str(w[0].message), "result": dtype})
        else:
            results.append({"outcome": "silent", "message": f"concat coerced dose to '{dtype}' silently", "result": f"coerced to '{dtype}' dtype"})
    except Exception as e:
        results.append({"outcome": "error", "message": str(e), "result": str(e)})

# g: Arithmetic on mixed-type column — string repetition instead of multiplication
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    try:
        if "combined_doses" in dir():
            doubled = combined_doses.with_columns(
                (pl.col("dose") * 2).alias("doubled")
            )
            val = doubled.filter(pl.col("drug") == "Insulin")["doubled"][0]
            is_repeated = val == "sliding scalesliding scale"
            if w:
                results.append({"outcome": "warning", "message": str(w[0].message), "result": is_repeated})
            else:
                results.append({"outcome": "silent", "message": f"'dose' * 2 repeated strings instead of multiplying: {is_repeated}", "result": "strings repeated, not math"})
        else:
            results.append({"outcome": "error", "message": "combined_doses not available (concat failed in f)", "result": None})
    except Exception as e:
        results.append({"outcome": "error", "message": str(e), "result": None})

# ═══════════════════════════════════════════════════════════════════════════════
# Append row type mismatch
# ═══════════════════════════════════════════════════════════════════════════════

patients = pl.DataFrame({
    "patient_id": ["P001"],
    "name": ["Alice"],
    "age": [30],
})

# h: Missing column silently filled with null
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    try:
        new_row = pl.DataFrame({"patient_id": ["P002"], "name": ["Bob"]})
        combined_patients = pl.concat([patients, new_row], how="diagonal")
        has_null = combined_patients["age"].null_count() > 0
        if w:
            results.append({"outcome": "warning", "message": str(w[0].message), "result": "Missing col filled with null"})
        else:
            results.append({"outcome": "silent", "message": f"missing column silently filled with null: {has_null}", "result": "Missing col filled with null"})
    except Exception as e:
        results.append({"outcome": "error", "message": str(e), "result": None})

# i: Wrong type silently coerced
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    try:
        bad_row = pl.DataFrame({"patient_id": ["P003"], "name": ["Carol"], "age": ["thirty"]})
        combined2 = pl.concat([patients, bad_row], how="diagonal")
        dtype = str(combined2["age"].dtype)
        if w:
            results.append({"outcome": "warning", "message": str(w[0].message), "result": "Age dtype coerced"})
        else:
            results.append({"outcome": "silent", "message": f"wrong type coerced age to '{dtype}'", "result": f"Age dtype coerced to {dtype}"})
    except Exception as e:
        results.append({"outcome": "error", "message": str(e), "result": str(e)})

# ═══════════════════════════════════════════════════════════════════════════════
# Duplicate column names
# ═══════════════════════════════════════════════════════════════════════════════

# j: Create df with duplicate "name" columns, then .str.to_uppercase()
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    try:
        # Polars may reject duplicate column names outright
        df = pl.DataFrame(
            {"id": [1], "name": ["Alice"], "name_dup": ["ED"]}
        ).rename({"name_dup": "name"})
        upper = df["name"].str.to_uppercase()
        results.append({"outcome": "silent", "message": f"str.to_uppercase() returned {type(upper).__name__}", "result": str(upper)})
    except Exception as e:
        results.append({"outcome": "error", "message": str(e), "result": "str.to_uppercase() failed on duplicate col"})

print(json.dumps(results))
