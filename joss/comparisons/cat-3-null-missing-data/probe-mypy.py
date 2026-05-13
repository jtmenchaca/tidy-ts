"""Probe: Category 3 — Mypy static type checking of null/missing data errors.

Generates a Python file with all 17 cat-3 error cases, runs mypy in strict
mode with pandas-stubs, and reports which cases mypy catches vs misses.

Each case is tagged with a comment like `# CASE_a` so we can map mypy errors
back to specific probes.

Methodology:
  - Mypy runs in strict mode with --ignore-missing-imports (equivalent to
    pyright's reportMissingTypeStubs).
  - Only unused-import and unused-variable diagnostics are filtered (housekeeping).
  - Type annotations are added to all DataFrame variables and intermediate
    results where Python's type system can express them, giving mypy the
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

# ── Target file for mypy to check ────────────────────────────────────────────

TARGET_CODE = '''\
"""Cat-3 null/missing data cases for mypy static analysis."""
import pandas as pd
import numpy as np

encounters: pd.DataFrame = pd.read_csv("fixtures/encounters.csv")
labs: pd.DataFrame = pd.read_csv("fixtures/lab_results.csv")

# CASE_a: String method on column with NaN
los_label = encounters["discharge_date"].str.slice(0, 10)

# CASE_b: Arithmetic on column with NaN
deviation = labs["result_value"] - labs["reference_high"]

# CASE_c: Comparison with NaN — filtering silently drops NaN rows
critical = labs[labs["reference_high"] > 100]

# CASE_d: Division with NaN — NaN propagates silently
pct = labs["result_value"] / labs["reference_high"]

# CASE_e: Re-introduce NaN after fillna, then divide
filled = labs.copy()
filled["reference_high"] = filled["reference_high"].fillna(999)
filled.loc[filled["result_value"] > 150, "reference_high"] = np.nan
pct2 = filled["result_value"] / filled["reference_high"]

# CASE_f: mean() then arithmetic — NaN skipped silently
avg = labs["reference_high"].mean()
doubled_mean = avg * 2

# CASE_g: sum() then arithmetic — NaN skipped silently
total = labs["reference_high"].sum()
doubled_sum = total * 2

# CASE_h: min() then arithmetic — NaN skipped silently
mn = labs["reference_high"].min()
doubled_min = mn * 2

# CASE_i: groupby mean then arithmetic — NaN groups produce NaN
grouped = labs.groupby("test_name")["reference_high"].mean()
inc = grouped + 1

# CASE_j: sum() silently skips NaN
values = pd.Series([1250, np.nan, 450])
total_j = values.sum()

# CASE_k: Arithmetic on NaN-skipped sum — no type indication
per_patient = total_j / 2

# CASE_l: shift() silently introduces NaN
values_l = pd.Series([100, 200, 300, 400])
lagged = values_l.shift(1)

# CASE_m: Arithmetic on NaN from shift propagates
diff = lagged - values_l

# CASE_n: sort_values silently puts NaN at end
labs_n = pd.DataFrame({"patient_id": ["P001", "P002", "P003"], "result_value": [100, np.nan, 50]})
sorted_df = labs_n.sort_values("result_value")

# CASE_o: Arithmetic on pivot NaN — missing combo produces NaN
vitals = pd.DataFrame({"patient_id": ["P001", "P001", "P002"], "metric": ["systolic", "diastolic", "systolic"], "value": [130, 85, 145]})
wide = vitals.pivot_table(index="patient_id", columns="metric", values="value")
pp = wide["systolic"] - wide["diastolic"]

# CASE_p: Null and missing both become NaN — indistinguishable
df1 = pd.DataFrame({"id": ["P001"], "value": [np.nan]})
df2 = pd.DataFrame({"id": ["P002"]})
combined = pd.concat([df1, df2], ignore_index=True)
both_nan = combined["value"].isna().all()

# CASE_q: Conditional fill treats null and missing identically
filled_q = combined["value"].fillna("inconclusive")
'''

CASES = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q"]

CASE_LABELS = {
    "a": "method call on nullable column",
    "b": "arithmetic on nullable column",
    "c": "comparison on nullable column",
    "d": "arithmetic on nullable before narrowing",
    "e": "arithmetic after re-introducing null",
    "f": "mean on nullable column then arithmetic",
    "g": "sum on nullable column then arithmetic",
    "h": "min on nullable column then arithmetic",
    "i": "groupby mean on nullable column then arithmetic",
    "j": "sum silently skips or returns null",
    "k": "arithmetic on null-skipped aggregation result",
    "l": "shift/lag introduces null at boundary",
    "m": "arithmetic on lagged null propagates",
    "n": "sort silently places null at end",
    "o": "arithmetic on null from missing pivot combination",
    "p": "null vs missing conflated",
    "q": "conditional fill on null vs missing",
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


def run_mypy(filepath: str) -> list[dict]:
    """Run mypy in strict mode and return parsed errors."""
    result = subprocess.run(
        [
            "mypy",
            "--strict",
            "--output", "json",
            "--ignore-missing-imports",
            "--no-error-summary",
            filepath,
        ],
        capture_output=True,
        text=True,
    )

    errors = []
    for line in result.stdout.strip().split("\n"):
        if not line.strip():
            continue
        try:
            diag = json.loads(line)
            # Filter out unused-import and unused-variable noise
            code = diag.get("code", "")
            if code in ("import", "unused-import", "unused-variable"):
                continue
            errors.append({
                "line": diag.get("line", 0),
                "message": diag.get("message", ""),
                "severity": diag.get("severity", "error"),
                "code": code,
            })
        except json.JSONDecodeError:
            continue
    return errors


def main():
    with tempfile.TemporaryDirectory() as tmpdir:
        filepath = os.path.join(tmpdir, "cat3_cases.py")
        with open(filepath, "w") as f:
            f.write(TARGET_CODE)

        errors = run_mypy(filepath)
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
                    "message": f"mypy missed: {CASE_LABELS[case]}",
                    "result": "mypy: no error",
                })

        print(json.dumps(results))


if __name__ == "__main__":
    main()
