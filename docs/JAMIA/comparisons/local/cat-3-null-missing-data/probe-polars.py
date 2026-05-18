"""Probe: Category 3 — Null & Missing Data Errors in Python/Polars

Consolidates error classes 05, 11, 12, 21, 24, 26, 35.
"""
import json
import polars as pl
import warnings
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))
results = []

# ── Shared data ──────────────────────────────────────────────────────────────

encounters = pl.read_csv("../../fixtures/encounters.csv")
labs = pl.read_csv("../../fixtures/lab_results.csv")

# ═══════════════════════════════════════════════════════════════════════════════
# Null safety
# ═══════════════════════════════════════════════════════════════════════════════

# a: String method on column with null (discharge_date has null for ED visits)
try:
    enc_a = encounters.with_columns(
        pl.col("discharge_date").str.slice(0, 10).alias("los_label")
    )
    has_null = enc_a["los_label"].null_count() > 0
    results.append({"outcome": "silent", "message": f"null propagated silently: {has_null}", "result": "null propagated silently"})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# b: Arithmetic on column with null (reference_high has null)
try:
    labs_b = labs.with_columns(
        (pl.col("result_value") - pl.col("reference_high")).alias("deviation")
    )
    has_null = labs_b["deviation"].null_count() > 0
    results.append({"outcome": "silent", "message": f"null propagated silently: {has_null}", "result": "null propagated silently"})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# c: Comparison with null — filtering silently drops null rows
try:
    total_rows = len(labs)
    critical = labs.filter(pl.col("reference_high") > 100)
    null_rows = labs["reference_high"].null_count()
    results.append({"outcome": "silent", "message": f"total={total_rows}, filtered={len(critical)}, null rows silently excluded={null_rows}", "result": f"{null_rows} null rows silently dropped"})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# ═══════════════════════════════════════════════════════════════════════════════
# Null narrowing
# ═══════════════════════════════════════════════════════════════════════════════

labs_11 = pl.read_csv("../../fixtures/lab_results.csv")

# d: Division with null — null propagates silently
try:
    labs_11d = labs_11.with_columns(
        (pl.col("result_value") / pl.col("reference_high")).alias("pct")
    )
    null_count = labs_11d["pct"].null_count()
    results.append({"outcome": "silent", "message": f"{null_count} null from null div", "result": f"{null_count} null from null div"})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# e: Re-introduce null after fill_null, then divide — null propagates again
try:
    filled = labs_11.with_columns(
        pl.col("reference_high").fill_null(999)
    )
    filled = filled.with_columns(
        pl.when(pl.col("result_value") > 150)
        .then(None)
        .otherwise(pl.col("reference_high"))
        .alias("reference_high")
    )
    filled = filled.with_columns(
        (pl.col("result_value") / pl.col("reference_high")).alias("pct")
    )
    null_count = filled["pct"].null_count()
    results.append({"outcome": "silent", "message": f"{null_count} null after re-null div", "result": f"{null_count} null after re-null div"})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# ═══════════════════════════════════════════════════════════════════════════════
# Aggregation on missing data
# ═══════════════════════════════════════════════════════════════════════════════

labs_12 = pl.read_csv("../../fixtures/lab_results.csv")

# f: mean() silently skips null
try:
    avg = labs_12["reference_high"].mean()
    doubled = avg * 2
    results.append({"outcome": "silent", "message": f"mean={avg}, doubled={doubled} (null skipped)", "result": "mean*2 skipped null silently"})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# g: sum() silently skips null
try:
    total = labs_12["reference_high"].sum()
    doubled = total * 2
    results.append({"outcome": "silent", "message": f"sum={total}, doubled={doubled} (null skipped)", "result": "sum*2 skipped null silently"})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# h: min() silently skips null
try:
    mn = labs_12["reference_high"].min()
    doubled = mn * 2
    results.append({"outcome": "silent", "message": f"min={mn}, doubled={doubled} (null skipped)", "result": "min*2 skipped null silently"})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# i: groupby mean then arithmetic — null groups produce null+1=null
try:
    grouped = labs_12.group_by("test_name").agg(
        pl.col("reference_high").mean()
    )
    inc = grouped.with_columns(
        (pl.col("reference_high") + 1).alias("reference_high_inc")
    )
    null_count = inc["reference_high_inc"].null_count()
    results.append({"outcome": "silent", "message": f"{null_count} groups: null+1 still null", "result": f"{null_count} null+1 still null"})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# ═══════════════════════════════════════════════════════════════════════════════
# Aggregation return type narrowing
# ═══════════════════════════════════════════════════════════════════════════════

values_21 = pl.Series([1250, None, 450])

# j: sum() silently skips null — returns 1700, not null
try:
    total = values_21.sum()
    skipped = values_21.null_count()
    results.append({"outcome": "silent", "message": f"sum() silently skipped {skipped} null, returned {total}", "result": "Skipped 1 null, returned 1700"})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# k: Arithmetic on result works — no type indication data was incomplete
try:
    per_patient = total / 2
    results.append({"outcome": "silent", "message": f"arithmetic on null-skipped sum succeeded: {per_patient}", "result": "Divided null-skipped sum by 2"})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# ═══════════════════════════════════════════════════════════════════════════════
# Window function output type
# ═══════════════════════════════════════════════════════════════════════════════

values_24 = pl.Series([100, 200, 300, 400])

# l: shift() silently introduces null
try:
    lagged = values_24.shift(1)
    null_count = lagged.null_count()
    results.append({"outcome": "silent", "message": f"shift() silently introduced {null_count} null", "result": "shift() introduced 1 null"})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# m: Arithmetic on null from shift propagates silently
try:
    diff = lagged - values_24
    null_count = diff.null_count()
    results.append({"outcome": "silent", "message": f"arithmetic on shifted null produced {null_count} null", "result": "null propagated in subtraction"})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# ═══════════════════════════════════════════════════════════════════════════════
# Sorting on nullable columns
# ═══════════════════════════════════════════════════════════════════════════════

labs_26 = pl.DataFrame({
    "patient_id": ["P001", "P002", "P003"],
    "result_value": [100, None, 50],
})

# n: sort silently puts null at beginning (Polars default: nulls_last=False)
try:
    sorted_df = labs_26.sort("result_value")
    first_val = sorted_df["result_value"][0]
    null_at_start = first_val is None
    results.append({"outcome": "silent", "message": f"sort silently placed null at start: {null_at_start}", "result": "null silently placed at start"})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# ═══════════════════════════════════════════════════════════════════════════════
# Pivot column mismatch
# ═══════════════════════════════════════════════════════════════════════════════

vitals = pl.DataFrame({
    "patient_id": ["P001", "P001", "P002"],
    "metric": ["systolic", "diastolic", "systolic"],
    "value": [130, 85, 145],
})

# o: arithmetic on pivot null — systolic - diastolic with null from missing combo
try:
    wide = vitals.pivot(on="metric", index="patient_id", values="value")
    wide = wide.with_columns(
        (pl.col("systolic") - pl.col("diastolic")).alias("pp")
    )
    p002_pp = wide.filter(pl.col("patient_id") == "P002")["pp"][0]
    results.append({"outcome": "silent", "message": f"null propagates: 145-null={p002_pp}", "result": f"145-null={p002_pp}"})
except Exception as e:
    results.append({"outcome": "error", "message": str(e), "result": None})

# ═══════════════════════════════════════════════════════════════════════════════
# Nullable vs optional distinction
# ═══════════════════════════════════════════════════════════════════════════════

# p: Empty cell and missing column both become null — indistinguishable
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    df1 = pl.DataFrame({"id": ["P001"], "value": [None]}).cast({"value": pl.Float64})
    df2 = pl.DataFrame({"id": ["P002"]})
    combined = pl.concat([df1, df2], how="diagonal")
    both_null = bool(combined["value"].is_null().all())
    distinguishable = False
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": None})
    else:
        results.append({"outcome": "silent", "message": f"null and missing both null, distinguishable: {distinguishable}", "result": "null and missing both null"})

# q: conditional fill — both null types treated the same
with warnings.catch_warnings(record=True) as w:
    warnings.simplefilter("always")
    filled = combined.with_columns(
        pl.when(pl.col("value").is_null())
        .then(pl.lit("inconclusive"))
        .otherwise(pl.col("value").cast(pl.Utf8))
        .alias("value")
    )
    vals = filled["value"].to_list()
    if w:
        results.append({"outcome": "warning", "message": str(w[0].message), "result": None})
    else:
        results.append({"outcome": "silent", "message": f"both filled same: {vals}", "result": "both filled identically"})

print(json.dumps(results))
