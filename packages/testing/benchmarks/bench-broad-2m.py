#!/usr/bin/env python3
"""
Broad Python benchmark at 2M rows (pandas + Polars).
Matches bench-broad-2m.ts operations.
"""
import polars as pl
import pandas as pd
import numpy as np
import time
import os

os.environ["POLARS_MAX_THREADS"] = "4"

N = 2_000_000
ITERS = 10
WARMUP = 5

def median(arr):
    s = sorted(arr)
    return s[len(s) // 2]

def bench(label, fn):
    for _ in range(WARMUP):
        fn()
    times = []
    for _ in range(ITERS):
        t0 = time.perf_counter()
        fn()
        times.append((time.perf_counter() - t0) * 1000)
    return median(times)

print(f"\n=== Broad Python Benchmark ({N//1_000_000}M rows, {ITERS} iters, {WARMUP} warmup) ===\n")

# Generate raw data
print("Generating data...")
rng = np.random.default_rng(42)
ids = np.arange(1, N + 1)
values = rng.random(N) * 1000
categories = [f"cat_{i % 20}" for i in range(N)]
scores = rng.random(N) * 100
actives = [i % 3 == 0 for i in range(N)]

data_dict = {
    "id": ids,
    "value": values,
    "category": categories,
    "score": scores,
    "active": actives,
}

# Build DataFrames
pl_df = pl.DataFrame(data_dict)
pd_df = pd.DataFrame(data_dict)
print("  DataFrames built\n")

# Join data
right_size = int(N * 0.8)
join_ids = rng.integers(1, N + 1, right_size)
join_values_b = rng.random(right_size) * 1000
join_status = [["active", "pending", "complete"][i % 3] for i in range(right_size)]

pl_join_right = pl.DataFrame({"id": join_ids, "value_b": join_values_b, "status": join_status})
pd_join_right = pd.DataFrame({"id": join_ids, "value_b": join_values_b, "status": join_status})

# Split for bind
pl_df1 = pl_df.head(N // 2)
pl_df2 = pl_df.tail(N - N // 2)
pd_df1 = pd_df.head(N // 2)
pd_df2 = pd_df.tail(N - N // 2)

# Pivot data
pivot_ids = np.arange(1, N + 1)
pivot_regions = [f"region_{i % 5}" for i in range(N)]
pivot_products = [f"product_{i % 10}" for i in range(N)]
pivot_q1 = rng.integers(0, 1000, N)
pivot_q2 = rng.integers(0, 1000, N)
pivot_q3 = rng.integers(0, 1000, N)
pivot_q4 = rng.integers(0, 1000, N)

pl_pivot = pl.DataFrame({
    "id": pivot_ids, "region": pivot_regions, "product": pivot_products,
    "q1": pivot_q1, "q2": pivot_q2, "q3": pivot_q3, "q4": pivot_q4,
})
pd_pivot = pd.DataFrame({
    "id": pivot_ids, "region": pivot_regions, "product": pivot_products,
    "q1": pivot_q1, "q2": pivot_q2, "q3": pivot_q3, "q4": pivot_q4,
})

# Pre-select for joins
pl_id_val = pl_df.select(["id", "value"])
pd_id_val = pd_df[["id", "value"]]

# ── Results storage ──
polars_results = []
pandas_results = []

def run_both(label, polars_fn, pandas_fn):
    pl_ms = bench(label, polars_fn)
    pd_ms = bench(label, pandas_fn)
    polars_results.append((label, pl_ms))
    pandas_results.append((label, pd_ms))
    print(f"  {label:<30} polars={pl_ms:>9.3f}ms   pandas={pd_ms:>9.3f}ms   ratio={pd_ms/pl_ms:>6.1f}x")

# 1. Creation
run_both("creation",
    lambda: pl.DataFrame(data_dict),
    lambda: pd.DataFrame(data_dict),
)

# 2. Filter (numeric)
run_both("filter (numeric)",
    lambda: pl_df.filter(pl.col("value") > 500),
    lambda: pd_df[pd_df["value"] > 500],
)

# 3. Filter (string)
run_both("filter (string)",
    lambda: pl_df.filter(pl.col("category") == "cat_5"),
    lambda: pd_df[pd_df["category"] == "cat_5"],
)

# 4. Filter (complex)
run_both("filter (complex)",
    lambda: pl_df.filter((pl.col("value") > 300) & (pl.col("score") > 50) & pl.col("active")),
    lambda: pd_df[(pd_df["value"] > 300) & (pd_df["score"] > 50) & pd_df["active"]],
)

# 5. Select
run_both("select",
    lambda: pl_df.select(["id", "value", "category"]),
    lambda: pd_df[["id", "value", "category"]],
)

# 6. Sort (numeric)
run_both("sort (numeric)",
    lambda: pl_df.sort("value"),
    lambda: pd_df.sort_values("value"),
)

# 7. Sort (string)
run_both("sort (string)",
    lambda: pl_df.sort("category"),
    lambda: pd_df.sort_values("category", kind="mergesort"),
)

# 8. Sort (multi-col)
run_both("sort (multi-col)",
    lambda: pl_df.sort(["category", "value"], descending=[False, True]),
    lambda: pd_df.sort_values(["category", "value"], ascending=[True, False]),
)

# 9. Mutate (col/scalar)
run_both("mutate (col/scalar)",
    lambda: pl_df.with_columns((pl.col("score") / 100).alias("score_pct")),
    lambda: pd_df.assign(score_pct=pd_df["score"] / 100),
)

# 10. Mutate (col+col)
run_both("mutate (col+col)",
    lambda: pl_df.with_columns((pl.col("value") + pl.col("score")).alias("total")),
    lambda: pd_df.assign(total=pd_df["value"] + pd_df["score"]),
)

# 11. Mutate (string upper)
run_both("mutate (string upper)",
    lambda: pl_df.with_columns(pl.col("category").str.to_uppercase().alias("cat_upper")),
    lambda: pd_df.assign(cat_upper=pd_df["category"].str.upper()),
)

# 12. Mutate (scalar)
run_both("mutate (scalar)",
    lambda: pl_df.with_columns(pl.lit(42).alias("constant")),
    lambda: pd_df.assign(constant=42),
)

# 13. Distinct
run_both("distinct",
    lambda: pl_df.unique(),
    lambda: pd_df.drop_duplicates(),
)

# 14. GroupBy (single)
run_both("groupBy (single)",
    lambda: pl_df.group_by("category").len(),
    lambda: pd_df.groupby("category", sort=False).size().reset_index(name="len"),
)

# 15. GroupBy (multi)
run_both("groupBy (multi)",
    lambda: pl_df.group_by(["category", "active"]).len(),
    lambda: pd_df.groupby(["category", "active"], sort=False).size().reset_index(name="len"),
)

# 16. Summarise (ungrouped)
run_both("summarise (ungrouped)",
    lambda: pl_df.select([
        pl.count("id").alias("count"),
        pl.mean("value").alias("avg_value"),
        pl.sum("value").alias("total_value"),
    ]),
    lambda: pd.DataFrame({
        "count": [pd_df["id"].count()],
        "avg_value": [pd_df["value"].mean()],
        "total_value": [pd_df["value"].sum()],
    }),
)

# 17. Summarise (grouped)
run_both("summarise (grouped)",
    lambda: pl_df.group_by("category").agg([
        pl.count("id").alias("count"),
        pl.mean("value").alias("avg_value"),
        pl.sum("value").alias("total_value"),
    ]),
    lambda: pd_df.groupby("category", sort=False).agg(
        count=("id", "count"),
        avg_value=("value", "mean"),
        total_value=("value", "sum"),
    ).reset_index(),
)

# 18. Inner Join
run_both("innerJoin",
    lambda: pl_id_val.join(pl_join_right, on="id", how="inner"),
    lambda: pd_id_val.merge(pd_join_right, on="id", how="inner"),
)

# 19. Left Join
run_both("leftJoin",
    lambda: pl_id_val.join(pl_join_right, on="id", how="left"),
    lambda: pd_id_val.merge(pd_join_right, on="id", how="left"),
)

# 20. Pivot Longer
run_both("pivotLonger",
    lambda: pl_pivot.unpivot(
        index=["id", "region", "product"],
        on=["q1", "q2", "q3", "q4"],
        variable_name="quarter",
        value_name="sales",
    ),
    lambda: pd_pivot.melt(
        id_vars=["id", "region", "product"],
        value_vars=["q1", "q2", "q3", "q4"],
        var_name="quarter",
        value_name="sales",
    ),
)

# 21. Bind Rows
run_both("bindRows",
    lambda: pl.concat([pl_df1, pl_df2]),
    lambda: pd.concat([pd_df1, pd_df2], ignore_index=True),
)

# 22. Stats
run_both("stats",
    lambda: pl_df.select([
        pl.col("value").sum().alias("sum"),
        pl.col("value").mean().alias("mean"),
        pl.col("value").median().alias("median"),
        pl.col("value").var().alias("variance"),
        pl.col("value").std().alias("stdev"),
    ]),
    lambda: (
        pd_df["value"].sum(),
        pd_df["value"].mean(),
        pd_df["value"].median(),
        pd_df["value"].var(),
        pd_df["value"].std(),
    ),
)

# ── Summary table ──
print(f"\n{'─'*75}")
print(f"  {'Operation':<30} {'Polars':>9}   {'pandas':>9}   {'pd/pl':>6}")
print(f"{'─'*75}")
total_pl = 0
total_pd = 0
for (label, pl_ms), (_, pd_ms) in zip(polars_results, pandas_results):
    total_pl += pl_ms
    total_pd += pd_ms
    print(f"  {label:<30} {pl_ms:>8.3f}ms   {pd_ms:>8.3f}ms   {pd_ms/pl_ms:>5.1f}x")
print(f"{'─'*75}")
print(f"  {'TOTAL':<30} {total_pl:>8.3f}ms   {total_pd:>8.3f}ms   {total_pd/total_pl:>5.1f}x")

print("\nDone.")
