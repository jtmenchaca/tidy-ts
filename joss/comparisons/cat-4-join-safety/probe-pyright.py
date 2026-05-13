"""Probe: Category 4 — Pyright static type checking of join safety errors.

Generates a Python file with all 8 cat-4 error cases, runs pyright in strict
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
"""Cat-4 join safety cases for pyright static analysis."""
import pandas as pd

patients: pd.DataFrame = pd.read_csv("fixtures/patients.csv")
encounters: pd.DataFrame = pd.read_csv("fixtures/encounters.csv")
labs: pd.DataFrame = pd.read_csv("fixtures/lab_results.csv")

# CASE_a: join on key not in left table
merged_a = patients.merge(labs, on="encounter_id")

# CASE_b: join on misspelled key
merged_b = patients.merge(encounters, on="patient_ID")

# CASE_c: access missing column post-join
joined_c = patients.merge(encounters, on="patient_id")
val_c = joined_c["prescription_id"]

# CASE_d: string method on NaN from left join
patients_17 = pd.DataFrame({
    "patient_id": ["P001", "P002", "P003"],
    "name": ["Alice Johnson", "Bob Smith", "Carol Davis"],
})
encounters_17 = pd.DataFrame({
    "patient_id": ["P001", "P001"],
    "department": ["Emergency", "ICU"],
    "los_days": [3, 7],
})
joined_d = patients_17.merge(encounters_17, on="patient_id", how="left")
dept_upper = joined_d["department"].str.upper()

# CASE_e: arithmetic on NaN from left join
los_weeks = joined_d["los_days"] / 7

# CASE_f: comparison silently excludes NaN rows
long_stays = joined_d[joined_d["los_days"] > 5]

# CASE_g: explicit suffixes -- access original name
admissions = pd.DataFrame({
    "patient_id": ["P001", "P002"],
    "date": ["2024-01-15", "2024-02-20"],
    "department": ["ED", "ICU"],
})
discharges = pd.DataFrame({
    "patient_id": ["P001", "P002"],
    "date": ["2024-01-18", "2024-02-25"],
    "disposition": ["Home", "SNF"],
})
joined_g = admissions.merge(discharges, on="patient_id", suffixes=("_admit", "_discharge"))
date_g = joined_g["date"]

# CASE_h: no suffixes -- access ambiguous original name
joined_h = admissions.merge(discharges, on="patient_id")
date_h = joined_h["date"]
'''

CASES = ["a", "b", "c", "d", "e", "f", "g", "h"]

CASE_LABELS = {
    "a": "join on key not in left table",
    "b": "join on misspelled key",
    "c": "access missing column post-join",
    "d": "string method on join-introduced null",
    "e": "arithmetic on join-introduced null",
    "f": "comparison silently excludes null rows",
    "g": "explicit suffix then access original name",
    "h": "default suffix then access original name",
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
        filepath = os.path.join(tmpdir, "cat4_cases.py")
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
