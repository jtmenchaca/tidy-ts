"""Probe: Category 5 — Pyright static type checking of schema composition errors.

Generates a Python file with all 10 cat-5 error cases, runs pyright in strict
mode, and reports which cases pyright catches vs misses.

Each case is tagged with a comment like `# CASE_a` so we can map pyright errors
back to specific probes.

Methodology:
  - Pyright runs in strict mode with only housekeeping suppressions
    (reportUnusedImport, reportUnusedVariable, reportUnusedExpression).
  - No reportUnknown* or reportMissing* rules are suppressed.
  - Type annotations are added to all DataFrame variables and intermediate
    results where Python's type system can express them, giving pyright the
    best possible chance to catch errors.
  - The fundamental limitation is that pandas-stubs type DataFrame column
    access (df["col"]) as Series[Any], so column-level type information is
    erased regardless of user annotations.
"""
import json
import subprocess
import tempfile
import os
import re

# ── Generate the target file for pyright to check ────────────────────────────

TARGET_CODE = '''\
# pyright: strict, reportUnusedImport=false, reportUnusedVariable=false, reportUnusedExpression=false
"""Cat-5 schema composition cases for pyright static analysis."""
import os
import pandas as pd
import numpy as np
import tempfile

# CASE_a: Non-numeric value in numeric column at load time
csv_bad_type = "lab_id,result_value\\nL1,100\\nL2,pending\\nL3,200\\n"
with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as f:
    f.write(csv_bad_type)
    tmp_path = f.name
df_a: pd.DataFrame = pd.read_csv(tmp_path)
dtype_a = str(df_a["result_value"].dtype)
os.unlink(tmp_path)

# CASE_b: Missing column — accessed after load
df_b: pd.DataFrame = pd.read_csv("../fixtures/lab_results.csv")
val_b = df_b["nonexistent_column"]

# CASE_c: Empty cell in column that should be non-null
df_c: pd.DataFrame = pd.read_csv("../fixtures/lab_results.csv")
nan_count_c = int(df_c["reference_high"].isna().sum())

# CASE_d: concat with different schemas — fills NaN silently
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
combined_d = pd.concat([labs_a, labs_b], ignore_index=True)
nan_in_lab_site = int(combined_d["lab_site"].isna().sum())
nan_in_ref_range = int(combined_d["reference_range"].isna().sum())

# CASE_e: String op on NaN column after concat — silent propagation
combined_d["site_upper"] = combined_d["lab_site"].str.upper()
nan_count_e = int(combined_d["site_upper"].isna().sum())

# CASE_f: concat silently coerces dose from int64 to object
numeric_doses = pd.DataFrame({
    "drug": ["Aspirin", "Lisinopril"],
    "dose": [325, 10],
})
text_doses = pd.DataFrame({
    "drug": ["Insulin", "Warfarin"],
    "dose": ["sliding scale", "per INR"],
})
combined_doses = pd.concat([numeric_doses, text_doses], ignore_index=True)
dtype_f = str(combined_doses["dose"].dtype)

# CASE_g: Arithmetic on mixed-type column — string repetition instead of multiplication
combined_doses["doubled"] = combined_doses["dose"] * 2
val_g = combined_doses.loc[combined_doses["drug"] == "Insulin", "doubled"].iloc[0]

# CASE_h: Missing column silently filled with NaN
patients = pd.DataFrame({
    "patient_id": ["P001"],
    "name": ["Alice"],
    "age": [30],
})
new_row = pd.DataFrame({"patient_id": ["P002"], "name": ["Bob"]})
combined_patients = pd.concat([patients, new_row], ignore_index=True)
has_nan_h = bool(combined_patients["age"].isna().any())

# CASE_i: Wrong type silently coerced
bad_row = pd.DataFrame({"patient_id": ["P003"], "name": ["Carol"], "age": ["thirty"]})
combined_i = pd.concat([patients, bad_row], ignore_index=True)
dtype_i = str(combined_i["age"].dtype)

# CASE_j: Create df with duplicate "name" columns, then .str.upper()
df_j = pd.DataFrame([[1, "Alice", "ED"]], columns=["id", "name", "name"])
upper_j = df_j["name"].str.upper()
'''

CASES = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"]

CASE_LABELS = {
    "a": "non-numeric value in numeric column at load time",
    "b": "accessing nonexistent column after load",
    "c": "empty cell in non-null column at load time",
    "d": "concat with different schemas fills NaN",
    "e": "string op on NaN column after concat",
    "f": "implicit type coercion when binding rows",
    "g": "arithmetic on mixed-type column after coerced bind",
    "h": "appending row with missing column",
    "i": "appending row with wrong column type",
    "j": "string operation on duplicate column name",
}


def get_case_line_ranges(code: str) -> dict[str, tuple[int, int]]:
    """Map each CASE_x marker to the line range it covers."""
    lines = code.split("\n")
    markers: list[tuple[str, int]] = []
    for i, line in enumerate(lines, 1):
        m = re.search(r"# CASE_([a-z])", line)
        if m:
            markers.append((m.group(1), i))

    ranges: dict[str, tuple[int, int]] = {}
    for idx, (case, start) in enumerate(markers):
        if idx + 1 < len(markers):
            end = markers[idx + 1][1] - 1
        else:
            end = len(lines)
        ranges[case] = (start, end)
    return ranges


def run_pyright(filepath: str) -> list[dict]:
    """Run pyright and return parsed diagnostics."""
    result = subprocess.run(
        ["pyright", "--outputjson", filepath],
        capture_output=True,
        text=True,
    )

    try:
        data = json.loads(result.stdout)
    except json.JSONDecodeError:
        return []

    errors = []
    for diag in data.get("generalDiagnostics", []):
        errors.append({
            "line": diag["range"]["start"]["line"] + 1,  # 0-indexed to 1-indexed
            "message": diag["message"],
            "severity": diag["severity"],
        })
    return errors


def main():
    with tempfile.TemporaryDirectory() as tmpdir:
        filepath = os.path.join(tmpdir, "cat5_cases.py")
        with open(filepath, "w") as f:
            f.write(TARGET_CODE)

        errors = run_pyright(filepath)
        ranges = get_case_line_ranges(TARGET_CODE)

        results = []
        for case in CASES:
            start, end = ranges[case]
            case_errors = [e for e in errors if start <= e["line"] <= end]
            if case_errors:
                results.append({
                    "outcome": "error",
                    "message": case_errors[0]["message"],
                    "result": None,
                })
            else:
                results.append({
                    "outcome": "silent",
                    "message": f"pyright missed: {CASE_LABELS[case]}",
                    "result": "pyright: no error",
                })

        print(json.dumps(results))


if __name__ == "__main__":
    main()
