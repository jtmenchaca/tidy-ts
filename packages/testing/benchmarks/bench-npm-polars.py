#!/usr/bin/env python3
"""
Head-to-head benchmark: Polars — same operations as bench-npm-tidy.ts.

Setup:
  pip install polars numpy
  python3 bench-npm-polars.py

Companion file: bench-npm-tidy.ts (run with npx tsx)

100K rows, 20 iterations, 3 warmup, median reported.
Results documented in native-rayon-progress-log.md
"""

import polars as pl
import numpy as np
import time
import os

os.environ['POLARS_MAX_THREADS'] = '4'

WARMUP = 3
ITERATIONS = 20
N = 100_000

def bench(name, fn):
    for _ in range(WARMUP):
        fn()
    times = []
    for _ in range(ITERATIONS):
        t = time.perf_counter()
        fn()
        elapsed = (time.perf_counter() - t) * 1000
        times.append(elapsed)
    times.sort()
    median = times[len(times) // 2]
    mn = times[0]
    p95 = times[int(len(times) * 0.95)]
    print(f"  {name}: {median:.3f}ms median, {mn:.3f}ms min, {p95:.3f}ms p95")
    return median

print(f"\nPolars {pl.__version__} (threads={os.environ.get('POLARS_MAX_THREADS','?')})\n")

# --- Data generation ---
np.random.seed(42)
df = pl.DataFrame({
    'x': np.random.uniform(0, 100, N),
    'y': np.random.uniform(0, 50, N),
    'group': [['A','B','C','D'][i % 4] for i in range(N)],
})

# --- Basic stats ---
print(f"=== Basic Stats ({N:,} rows) ===")
bench("sum",           lambda: df.select(pl.col('x').sum()))
bench("mean",          lambda: df.select(pl.col('x').mean()))
bench("stdev",         lambda: df.select(pl.col('x').std()))
bench("median",        lambda: df.select(pl.col('x').median()))
bench("quantile(0.95)",lambda: df.select(pl.col('x').quantile(0.95)))

# --- DataFrame verbs ---
print(f"\n=== DataFrame Verbs ({N:,} rows) ===")
bench("filter (x > 50)",    lambda: df.filter(pl.col('x') > 50))
bench("mutate (z = x + y)", lambda: df.with_columns((pl.col('x') + pl.col('y')).alias('z')))
bench("arrange (x asc)",    lambda: df.sort('x'))
bench("select (x, y)",      lambda: df.select(['x', 'y']))

# --- GroupBy + Summarize ---
print(f"\n=== GroupBy + Summarize ({N:,} rows, 4 groups) ===")
bench("groupBy + summarize (sum, mean, n)", lambda: df.group_by('group').agg([
    pl.col('x').sum().alias('sum_x'),
    pl.col('y').mean().alias('mean_y'),
    pl.len().alias('n'),
]))

# --- Joins ---
LEFT_N = 50_000
RIGHT_N = 10_000
left_df = pl.DataFrame({
    'key': np.random.randint(0, 5000, LEFT_N).tolist(),
    'val_left': np.random.uniform(0, 1, LEFT_N),
})
right_df = pl.DataFrame({
    'key': np.random.randint(0, 5000, RIGHT_N).tolist(),
    'val_right': np.random.uniform(0, 1, RIGHT_N),
})

print(f"\n=== Joins (left={LEFT_N:,}, right={RIGHT_N:,}) ===")
bench("innerJoin", lambda: left_df.join(right_df, on='key', how='inner'))
bench("leftJoin",  lambda: left_df.join(right_df, on='key', how='left'))

print(f"\nDone.\n")
