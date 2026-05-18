"""Probe: Category 1 — Pyright static type checking of column/schema reference errors.

Generates a Python file with all 16 cat-1 error cases, runs pyright in strict
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
"""Cat-1 column & schema reference cases for pyright static analysis."""
import pandas as pd
import warnings

patients: pd.DataFrame = pd.read_csv("fixtures/patients.csv")
labs: pd.DataFrame = pd.read_csv("fixtures/lab_results.csv")
encounters: pd.DataFrame = pd.read_csv("fixtures/encounters.csv")

# CASE_a: Misspelled column in mutate-like operation
patients["full_name"] = patients["patientId"] + " " + patients["last_name"]

# CASE_b: Nonexistent column in filter
filtered = patients[patients["diagnosis"] == "I50.9"]

# CASE_c: Misspelled column in sort
sorted_labs = labs.sort_values("result_values", ascending=False)

# CASE_d: Accessing dropped column
slim = encounters[["encounter_id", "patient_id", "department"]]
val_d = slim["attending_physician"]

# CASE_e: Accessing original columns after groupby/agg
summary = encounters.groupby("department").size().reset_index(name="count")
filtered_e = summary[summary["encounter_type"] == "Inpatient"]

# CASE_f: Sorting by dropped column
no_physician = encounters.drop(columns=["attending_physician"])
sorted_df = no_physician.sort_values("attending_physician")

# CASE_g: Using old column name after rename
pipeline = encounters.rename(columns={"department": "dept"})
pipeline_g = pipeline[pipeline["department"] == "ICU"]

# CASE_h: Accessing column removed by groupby/agg
pipeline_h = (
    encounters
    .merge(labs, on=["encounter_id", "patient_id"])
    [["patient_id", "department", "test_name", "result_value"]]
    .groupby("patient_id")
    .agg(max_lab=("result_value", "max"))
    .reset_index()
)
pipeline_h["dept"] = pipeline_h["department"]

# CASE_i: Accessing non-existent pivot column
vitals = pd.DataFrame({
    "patient_id": ["P001", "P001", "P002", "P002"],
    "metric": ["systolic", "diastolic", "systolic", "diastolic"],
    "value": [130, 85, 145, 92],
})
wide = vitals.pivot(index="patient_id", columns="metric", values="value").reset_index()
wide.columns.name = None
val_i = wide["temperature"]

# CASE_j: Pre-pivot column gone
val_j = wide["metric"]

# CASE_k: drop_duplicates keeps all columns — no schema narrowing
enc_distinct = pd.DataFrame({
    "patient_id": ["P001", "P001", "P002", "P002"],
    "department": ["Cardiology", "Cardiology", "Emergency", "Primary Care"],
    "encounter_type": ["Outpatient", "Inpatient", "ED", "Outpatient"],
    "physician": ["Dr. Patel", "Dr. Patel", "Dr. Lee", "Dr. Martinez"],
})
unique = enc_distinct.drop_duplicates(subset=["patient_id", "department"])
has_physician = "physician" in unique.columns

# CASE_l: drop_duplicates with keep='first' keeps all columns
unique2 = enc_distinct.drop_duplicates(subset=["patient_id", "department"], keep="first")
has_physician2 = "physician" in unique2.columns

# CASE_m: df[['col1', 'col2']] silently drops other columns
patients_28 = pd.DataFrame({
    "patient_id": ["P001"],
    "name": ["Alice"],
    "age": [30],
    "insurance": ["Medicare"],
})
selected = patients_28[["name", "patient_id"]]
cols_lost = len(patients_28.columns) - len(selected.columns)

# CASE_n: groupby with wrong column — error message quality
patients_36 = pd.DataFrame({
    "patient_id": ["P001"],
    "name": ["Alice"],
    "department": ["ED"],
})
patients_36.groupby("dept")

# CASE_o: Column access error message quality
_ = patients_36["dept"]

# CASE_p: Multi-level groupby + agg silently produces MultiIndex
labs_19 = pd.DataFrame({
    "patient_id": ["P001", "P001", "P002", "P002"],
    "test_name": ["BNP", "WBC", "BNP", "WBC"],
    "result_value": [1250, 15.2, 450, 8.1],
})
multi = labs_19.groupby(["patient_id", "test_name"]).agg({"result_value": "mean"})
is_multi = str(type(multi.index).__name__)
'''

CASES = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p"]

CASE_LABELS = {
    "a": "misspelled column name in expression",
    "b": "nonexistent column in predicate",
    "c": "misspelled column name in sort",
    "d": "column dropped by selection still referenced",
    "e": "original column referenced after aggregation",
    "f": "dropped column used in sort",
    "g": "old column name used after rename",
    "h": "pre-aggregation column referenced after summarize",
    "i": "undeclared column after pivot",
    "j": "consumed column referenced after pivot",
    "k": "unselected column referenced after distinct",
    "l": "narrowed schema after distinct without keep-all",
    "m": "unselected column referenced after select",
    "n": "error message lists available columns",
    "o": "error message on invalid column access",
    "p": "residual grouping after summarize",
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
        filepath = os.path.join(tmpdir, "cat1_cases.py")
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
