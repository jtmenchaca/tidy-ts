"""Probe: Category 2 — Pyright static type checking of type safety errors.

Generates a Python file with all 14 cat-2 error cases, runs pyright in strict
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
"""Cat-2 type safety cases for pyright static analysis."""
from typing import Any
import pandas as pd
import numpy as np

labs: pd.DataFrame = pd.read_csv("fixtures/lab_results.csv")

# CASE_a: Arithmetic on string column
adjusted = labs["test_name"] + 10

# CASE_b: Numeric aggregation on string column
avg_b = labs.groupby("test_name")["test_name"].mean()

# CASE_c: Comparing number to string literal
filtered_c = labs[labs["result_value"] == "high"]

# CASE_d: Unparseable string silently becomes NaN
conv_labs = pd.DataFrame({
    "lab_id": ["L1", "L2", "L3"],
    "test_name": ["BNP", "pH", "WBC"],
    "result_str": ["1250", "7.28", "pending"],
})
conv_labs["result_num"] = pd.to_numeric(conv_labs["result_str"], errors="coerce")

# CASE_e: Arithmetic on NaN propagates silently
doubled_e = conv_labs["result_num"] * 2

# CASE_f: Mean after conversion silently skips NaN
avg_f = conv_labs["result_num"].mean()

# CASE_g: Arithmetic on mixed-type return column
mixed_labs = pd.DataFrame({
    "patient_id": ["P001", "P002", "P003"],
    "test_name": ["BNP", "WBC", "Glucose"],
    "result_value": [1250, 15.2, 210],
})
def classify(row: "pd.Series[Any]") -> object:
    val: object = row["result_value"]
    if isinstance(val, (int, float)) and val > 100:
        return "HIGH"
    return val
mixed_labs["status"] = mixed_labs.apply(classify, axis=1)
doubled_g = mixed_labs["status"] * 2

# CASE_h: Invalid date string silently becomes NaT
dates_h = pd.to_datetime(["2024-01-15", "not-a-date", "2024-02-20"], errors="coerce")

# CASE_i: Date compared to number
df_dates = pd.DataFrame({
    "patient_id": ["P001", "P002"],
    "admit_date": pd.to_datetime(["2024-01-15", "2024-02-20"]),
    "los_days": [3, 7],
})
filtered_i = df_dates[df_dates["admit_date"] > 100]

# CASE_j: Date + number arithmetic
shifted_j = df_dates["admit_date"] + 7

# CASE_k: Numeric operation applied to string column
patients = pd.DataFrame({
    "name": ["Alice", "Bob"],
    "age": [30, 45],
    "weight": [65.5, 80.0],
    "insurance": ["Medicare", "Medicaid"],
})
def double_col(x: "pd.Series[Any]") -> "pd.Series[Any]":
    return x * 2
result_k = patients[["age", "insurance"]].apply(double_col)

# CASE_l: Arithmetic on transposed mixed-type column
vitals = pd.DataFrame({
    "metric": ["systolic", "diastolic"],
    "P001": [120, 80],
    "P002": [145, 92],
})
transposed = vitals.T
transposed.columns = ["row_0", "row_1"]
doubled_l = transposed["row_0"] * 2

# CASE_m: Pre-transpose column name after transpose
old_col = transposed["P001"]

# CASE_n: Filter on invalid enum value
encounters = pd.DataFrame({
    "patient_id": ["P001", "P002"],
    "status": pd.Categorical(["admitted", "discharged"],
                              categories=["admitted", "discharged", "transferred"]),
})
filtered_n = encounters[encounters["status"] == "unknown"]
'''

CASES = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n"]

CASE_LABELS = {
    "a": "arithmetic on string column",
    "b": "numeric aggregation on string column",
    "c": "number compared to string literal",
    "d": "unparseable string silently becomes NaN",
    "e": "arithmetic on NaN propagates silently",
    "f": "mean after conversion silently skips NaN",
    "g": "arithmetic on mixed-type return column",
    "h": "invalid date string silently becomes NaT",
    "i": "date compared to number",
    "j": "date + number arithmetic",
    "k": "numeric operation applied to string column",
    "l": "arithmetic on transposed mixed-type column",
    "m": "pre-transpose column name after transpose",
    "n": "filter on invalid enum value",
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
        filepath = os.path.join(tmpdir, "cat2_cases.py")
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
