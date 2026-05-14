"""Probe: Category 3 — Null & Missing Data Errors in Python/pandas

Consolidates error classes 05, 11, 12, 21, 24, 26, 35.
"""
import json
import pandas as pd
import numpy as np
import warnings
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))
results = []

# ── Shared data ──────────────────────────────────────────────────────────────

encounters = pd.read_csv("../fixtures/encounters.csv")
labs = pd.read_csv("../fixtures/lab_results.csv")

# ═══════════════════════════════════════════════════════════════════════════════
# Null safety
# ═══════════════════════════════════════════════════════════════════════════════

# a: String method on column with NaN (discharge_date has NaN for ED visits)
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    try:
        encounters["los_label"] = encounters["discharge_date"].str.slice(0, 10)
        has_nan = encounters["los_label"].isna().any()
        if w:
            results.append({"outcome": "warning", "message": str(w[0].message), "result": None})
        else:
            results.append({"outcome": "silent", "message": f"NaN propagated silently: {has_nan}", "result": "NaN propagated silently"})
    except Exception as e:
        results.append({"outcome": "error", "message": str(e), "result": None})

# b: Arithmetic on column with NaN (reference_high has NaN)
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    try:
        labs["deviation"] = labs["result_value"] - labs["reference_high"]
        has_nan = labs["deviation"].isna().any()
        if w:
            results.append({"outcome": "warning", "message": str(w[0].message), "result": None})
        else:
            results.append({"outcome": "silent", "message": f"NaN propagated silently: {has_nan}", "result": "NaN propagated silently"})
    except Exception as e:
        results.append({"outcome": "error", "message": str(e), "result": None})

# c: Comparison with NaN — filtering silently drops NaN rows
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    try:
        total_rows = len(labs)
        critical = labs[labs["reference_high"] > 100]
        nan_rows = labs["reference_high"].isna().sum()
        if w:
            results.append({"outcome": "warning", "message": str(w[0].message), "result": None})
        else:
            results.append({"outcome": "silent", "message": f"total={total_rows}, filtered={len(critical)}, NaN rows silently excluded={nan_rows}", "result": f"{nan_rows} NaN rows silently dropped"})
    except Exception as e:
        results.append({"outcome": "error", "message": str(e), "result": None})

# ═══════════════════════════════════════════════════════════════════════════════
# Null narrowing
# ═══════════════════════════════════════════════════════════════════════════════

labs_11 = pd.read_csv("../fixtures/lab_results.csv")

# d: Division with NaN — NaN propagates silently
try:
    labs_11["pct"] = labs_11["result_value"] / labs_11["reference_high"]
    nan_count = int(labs_11["pct"].isna().sum())
    results.append({"outcome": "silent", "message": f"{nan_count} NaN from null div", "result": f"{nan_count} NaN from null div"})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# e: Re-introduce NaN after fillna, then divide — NaN propagates again
try:
    filled = labs_11.copy()
    filled["reference_high"] = filled["reference_high"].fillna(999)
    filled.loc[filled["result_value"] > 150, "reference_high"] = np.nan
    filled["pct"] = filled["result_value"] / filled["reference_high"]
    nan_count = int(filled["pct"].isna().sum())
    results.append({"outcome": "silent", "message": f"{nan_count} NaN after re-null div", "result": f"{nan_count} NaN after re-null div"})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# ═══════════════════════════════════════════════════════════════════════════════
# Aggregation on missing data
# ═══════════════════════════════════════════════════════════════════════════════

labs_12 = pd.read_csv("../fixtures/lab_results.csv")

# f: mean() then arithmetic — NaN skipped, doubled silently uses partial mean
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    avg = labs_12["reference_high"].mean()
    doubled = avg * 2
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": "mean*2 skipped NaN silently"})
    else:
        results.append({"outcome": "silent", "message": f"mean={avg}, doubled={doubled} (NaN skipped)", "result": "mean*2 skipped NaN silently"})

# g: sum() then arithmetic — NaN skipped, doubled silently uses partial sum
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    total = labs_12["reference_high"].sum()
    doubled = total * 2
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": "sum*2 skipped NaN silently"})
    else:
        results.append({"outcome": "silent", "message": f"sum={total}, doubled={doubled} (NaN skipped)", "result": "sum*2 skipped NaN silently"})

# h: min() then arithmetic — NaN skipped, doubled silently uses partial min
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    mn = labs_12["reference_high"].min()
    doubled = mn * 2
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": "min*2 skipped NaN silently"})
    else:
        results.append({"outcome": "silent", "message": f"min={mn}, doubled={doubled} (NaN skipped)", "result": "min*2 skipped NaN silently"})

# i: groupby mean then arithmetic — NaN groups produce NaN*2=NaN
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    grouped = labs_12.groupby("test_name")["reference_high"].mean()
    inc = grouped + 1
    nan_count = inc.isna().sum()
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": f"{nan_count} NaN+1 still NaN"})
    else:
        results.append({"outcome": "silent", "message": f"{nan_count} groups: NaN+1 still NaN", "result": f"{nan_count} NaN+1 still NaN"})

# ═══════════════════════════════════════════════════════════════════════════════
# Aggregation return type narrowing
# ═══════════════════════════════════════════════════════════════════════════════

values_21 = pd.Series([1250, np.nan, 450])

# j: sum() silently skips NaN — returns 1700, not NaN
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    total = values_21.sum()
    skipped = np.isnan(values_21).sum()
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": float(total)})
    else:
        results.append({"outcome": "silent", "message": f"sum() silently skipped {int(skipped)} NaN, returned {total}", "result": "Skipped 1 NaN, returned 1700"})

# k: Arithmetic on result works — no type indication data was incomplete
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    per_patient = total / 2
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": float(per_patient)})
    else:
        results.append({"outcome": "silent", "message": f"arithmetic on NaN-skipped sum succeeded: {per_patient}", "result": "Divided NaN-skipped sum by 2"})

# ═══════════════════════════════════════════════════════════════════════════════
# Window function output type
# ═══════════════════════════════════════════════════════════════════════════════

values_24 = pd.Series([100, 200, 300, 400])

# l: shift() silently introduces NaN
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    lagged = values_24.shift(1)
    nan_count = int(lagged.isna().sum())
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": nan_count})
    else:
        results.append({"outcome": "silent", "message": f"shift() silently introduced {nan_count} NaN", "result": "shift() introduced 1 NaN"})

# m: Arithmetic on NaN from shift propagates silently
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    diff = lagged - values_24
    nan_count = int(diff.isna().sum())
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": nan_count})
    else:
        results.append({"outcome": "silent", "message": f"arithmetic on shifted NaN produced {nan_count} NaN", "result": "NaN propagated in subtraction"})

# ═══════════════════════════════════════════════════════════════════════════════
# Sorting on nullable columns
# ═══════════════════════════════════════════════════════════════════════════════

labs_26 = pd.DataFrame({
    "patient_id": ["P001", "P002", "P003"],
    "result_value": [100, np.nan, 50],
})

# n: sort_values silently puts NaN at end
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    sorted_df = labs_26.sort_values("result_value")
    last_val = sorted_df["result_value"].iloc[-1]
    nan_at_end = pd.isna(last_val)
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": "NaN silently placed at end"})
    else:
        results.append({"outcome": "silent", "message": f"sort_values silently placed NaN at end: {nan_at_end}", "result": "NaN silently placed at end"})

# ═══════════════════════════════════════════════════════════════════════════════
# Pivot column mismatch
# ═══════════════════════════════════════════════════════════════════════════════

vitals = pd.DataFrame({
    "patient_id": ["P001", "P001", "P002"],
    "metric": ["systolic", "diastolic", "systolic"],
    "value": [130, 85, 145],
})

# o: arithmetic on pivot null — systolic - diastolic with NaN from missing combo
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    wide = vitals.pivot_table(index="patient_id", columns="metric", values="value")
    wide["pp"] = wide["systolic"] - wide["diastolic"]
    p002_pp = wide.loc["P002", "pp"]
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": f"145-NaN={p002_pp}"})
    else:
        results.append({"outcome": "silent", "message": f"NaN propagates: 145-NaN={p002_pp}", "result": f"145-NaN={p002_pp}"})

# ═══════════════════════════════════════════════════════════════════════════════
# Nullable vs optional distinction
# ═══════════════════════════════════════════════════════════════════════════════

# p: Empty cell and missing column both become NaN — indistinguishable
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    df1 = pd.DataFrame({"id": ["P001"], "value": [np.nan]})  # explicitly missing
    df2 = pd.DataFrame({"id": ["P002"]})  # field doesn't exist
    combined = pd.concat([df1, df2], ignore_index=True)
    both_nan = bool(combined["value"].isna().all())
    distinguishable = False
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": None})
    else:
        results.append({"outcome": "silent", "message": f"null and missing both NaN, distinguishable: {distinguishable}", "result": "null and missing both NaN"})

# q: conditional fill — only check for explicit null, miss absent column
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    filled = combined["value"].apply(lambda x: "inconclusive" if pd.isna(x) else x)
    vals = filled.tolist()
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": None})
    else:
        results.append({"outcome": "silent", "message": f"both filled same: {vals}", "result": "both filled identically"})

print(json.dumps(results))
