#!/usr/bin/env python3
"""
Polars mutate benchmark — matches bench-profile-mutate.ts test cases.
Run: python3 packages/testing/benchmarks/bench-polars-mutate.py
"""

import polars as pl
import numpy as np
import time
import os

os.environ["POLARS_MAX_THREADS"] = "4"

N = 100_000
ITERS = 50
WARMUP = 10

rng = np.random.default_rng(42)
df = pl.DataFrame({
    "x": rng.random(N) * 100,
    "y": rng.random(N) * 50,
    "name": [["alpha", "beta", "gamma", "delta"][i % 4] for i in range(N)],
    "flag": [i % 2 == 0 for i in range(N)],
})

def bench(label, fn):
    # warmup
    for _ in range(WARMUP):
        fn()
    times = []
    for _ in range(ITERS):
        t0 = time.perf_counter()
        fn()
        times.append((time.perf_counter() - t0) * 1000)
    times.sort()
    median = times[len(times) // 2]
    mn = times[0]
    p95 = times[int(len(times) * 0.95)]
    print(f"  {label}: {median:.3f}ms median, {mn:.3f}ms min, {p95:.3f}ms p95")

print(f"=== Polars Mutate Benchmark ({N:,} rows, {ITERS} iters, {WARMUP} warmup) ===\n")

# 1. col + col
bench("1. x + y (col+col)", lambda: df.with_columns((pl.col("x") + pl.col("y")).alias("z")))

# 2. col * col
bench("2. x * y (col*col)", lambda: df.with_columns((pl.col("x") * pl.col("y")).alias("z")))

# 3. col - col
bench("3. x - y (col-col)", lambda: df.with_columns((pl.col("x") - pl.col("y")).alias("z")))

# 4. col / scalar
bench("4. x / 2 (col/scalar)", lambda: df.with_columns((pl.col("x") / 2).alias("z")))

# 5. col + scalar
bench("5. x + 1 (col+scalar)", lambda: df.with_columns((pl.col("x") + 1).alias("z")))

# 6. col * scalar
bench("6. x * 100 (col*scalar)", lambda: df.with_columns((pl.col("x") * 100).alias("z")))

# 7. Multiple numeric columns
bench("7. x+y, x*y (multi)", lambda: df.with_columns([
    (pl.col("x") + pl.col("y")).alias("z"),
    (pl.col("x") * pl.col("y")).alias("w"),
]))

# 8. Boolean expression
bench("8. x > 50 (bool)", lambda: df.with_columns((pl.col("x") > 50).alias("big")))

# 9. Scalar (literal)
bench("9. literal 42 (scalar)", lambda: df.with_columns(pl.lit(42).alias("constant")))

# 10. Array assignment (Series)
arr_series = pl.Series("arr", list(range(0, N * 2, 2)))
bench("10. array assign", lambda: df.with_columns(arr_series))

# 11. String upper
bench("11. name.upper (string)", lambda: df.with_columns(pl.col("name").str.to_uppercase().alias("upper")))

# 12. Mixed: numeric + string + scalar
bench("12. mixed (num+str+scalar)", lambda: df.with_columns([
    (pl.col("x") + 1).alias("z"),
    (pl.col("name") + "!").alias("label"),
    pl.lit(0).alias("c"),
]))

# 13. Column drop
bench("13. drop column", lambda: df.drop("name"))

# 14. Chained mutate
bench("14. chained mutate", lambda: df.with_columns((pl.col("x") + 1).alias("z")).with_columns((pl.col("z") * 2).alias("w")))

# 15. Grouped mutate (numeric)
bench("15. grouped x+y", lambda: df.with_columns((pl.col("x") + pl.col("y")).over("name").alias("z")))

# 16. Grouped mutate (string)
bench("16. grouped upper", lambda: df.with_columns(pl.col("name").str.to_uppercase().over("name").alias("upper")))

# 17. Filter then mutate
filtered = df.filter(pl.col("x") > 50)
bench("17. filter→mutate", lambda: filtered.with_columns((pl.col("x") + pl.col("y")).alias("z")))

# 18. Conditional/ternary
bench("18. ternary", lambda: df.with_columns(
    pl.when(pl.col("x") > 50).then(pl.lit("high")).otherwise(pl.lit("low")).alias("cat")
))

print("\nDone.")
