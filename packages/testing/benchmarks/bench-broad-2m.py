#!/usr/bin/env python3
"""
Broad Polars benchmark at 2M rows.
Matches bench-broad-2m.ts operations.
"""
import polars as pl
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
    med = median(times)
    return med

print(f"\n=== Broad Polars Benchmark ({N//1_000_000}M rows, {ITERS} iters, {WARMUP} warmup) ===\n")

# Generate data
print("Generating data...")
rng = np.random.default_rng(42)
data = {
    "id": np.arange(1, N + 1),
    "value": rng.random(N) * 1000,
    "category": [f"cat_{i % 20}" for i in range(N)],
    "score": rng.random(N) * 100,
    "active": [i % 3 == 0 for i in range(N)],
}

df = pl.DataFrame(data)
print(f"  DataFrame built\n")

# Join data
right_size = int(N * 0.8)
join_right = pl.DataFrame({
    "id": rng.integers(1, N + 1, right_size),
    "value_b": rng.random(right_size) * 1000,
    "status": [["active", "pending", "complete"][i % 3] for i in range(right_size)],
})

# Split for bind
df1 = df.head(N // 2)
df2 = df.tail(N - N // 2)

# Pivot data
pivot_data = pl.DataFrame({
    "id": np.arange(1, N + 1),
    "region": [f"region_{i % 5}" for i in range(N)],
    "product": [f"product_{i % 10}" for i in range(N)],
    "q1": rng.integers(0, 1000, N),
    "q2": rng.integers(0, 1000, N),
    "q3": rng.integers(0, 1000, N),
    "q4": rng.integers(0, 1000, N),
})

results = []

def run(label, fn):
    ms = bench(label, fn)
    results.append((label, ms))
    print(f"  {label:<30} {ms:.3f}ms")

# 1. Creation
run("creation", lambda: pl.DataFrame(data))

# 2. Filter (numeric)
run("filter (numeric)", lambda: df.filter(pl.col("value") > 500))

# 3. Filter (string)
run("filter (string)", lambda: df.filter(pl.col("category") == "cat_5"))

# 4. Filter (complex)
run("filter (complex)", lambda: df.filter(
    (pl.col("value") > 300) & (pl.col("score") > 50) & pl.col("active")
))

# 5. Select
run("select", lambda: df.select(["id", "value", "category"]))

# 6. Sort (numeric)
run("sort (numeric)", lambda: df.sort("value"))

# 7. Sort (string)
run("sort (string)", lambda: df.sort("category"))

# 8. Sort (multi-col)
run("sort (multi-col)", lambda: df.sort(["category", "value"], descending=[False, True]))

# 9. Mutate (col/scalar)
run("mutate (col/scalar)", lambda: df.with_columns((pl.col("score") / 100).alias("score_pct")))

# 10. Mutate (col+col)
run("mutate (col+col)", lambda: df.with_columns((pl.col("value") + pl.col("score")).alias("total")))

# 11. Mutate (string upper)
run("mutate (string upper)", lambda: df.with_columns(pl.col("category").str.to_uppercase().alias("cat_upper")))

# 12. Mutate (scalar)
run("mutate (scalar)", lambda: df.with_columns(pl.lit(42).alias("constant")))

# 13. Distinct
run("distinct", lambda: df.unique())

# 14. GroupBy (single)
run("groupBy (single)", lambda: df.group_by("category").len())

# 15. GroupBy (multi)
run("groupBy (multi)", lambda: df.group_by(["category", "active"]).len())

# 16. Summarise (ungrouped)
run("summarise (ungrouped)", lambda: df.select([
    pl.count("id").alias("count"),
    pl.mean("value").alias("avg_value"),
    pl.sum("value").alias("total_value"),
]))

# 17. Summarise (grouped)
run("summarise (grouped)", lambda: df.group_by("category").agg([
    pl.count("id").alias("count"),
    pl.mean("value").alias("avg_value"),
    pl.sum("value").alias("total_value"),
]))

# 18. Inner Join
df_id_val = df.select(["id", "value"])
run("innerJoin", lambda: df_id_val.join(join_right, on="id", how="inner"))

# 19. Left Join
run("leftJoin", lambda: df_id_val.join(join_right, on="id", how="left"))

# 20. Pivot Longer
run("pivotLonger", lambda: pivot_data.unpivot(
    index=["id", "region", "product"],
    on=["q1", "q2", "q3", "q4"],
    variable_name="quarter",
    value_name="sales",
))

# 21. Bind Rows
run("bindRows", lambda: pl.concat([df1, df2]))

# 22. Stats
run("stats", lambda: df.select([
    pl.col("value").sum().alias("sum"),
    pl.col("value").mean().alias("mean"),
    pl.col("value").median().alias("median"),
    pl.col("value").var().alias("variance"),
    pl.col("value").std().alias("stdev"),
]))

print("\nDone.")
