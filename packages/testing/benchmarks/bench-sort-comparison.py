"""
Sort benchmark comparison: Polars vs tidy-ts baseline
Pre-builds all DataFrames to isolate sort performance.

Run with: python packages/testing/benchmarks/bench-sort-comparison.py
"""
import time
import numpy as np
import pandas as pd
import polars as pl

N = 500_000
WARMUP = 3
ITERATIONS = 5


def measure(fn):
    for _ in range(WARMUP):
        fn()
    times = []
    for _ in range(ITERATIONS):
        t = time.perf_counter()
        fn()
        times.append((time.perf_counter() - t) * 1000)
    times.sort()
    return times[len(times) // 2]


print(f"\nSort benchmark — {N:,} rows\n")

# Build data
np.random.seed(42)

numeric_pd = pd.DataFrame({
    "value": np.random.uniform(0, 1000, N),
    "date": pd.to_datetime([
        f"2020-{np.random.randint(1,13):02d}-{np.random.randint(1,29):02d}"
        for _ in range(N)
    ]),
    "score": [
        np.random.uniform(0, 100) if i % 10 != 0 else None
        for i in range(N)
    ],
})

mixed_pd = pd.DataFrame({
    "name": [f"name_{i % 100}" for i in range(N)],
    "category": [f"category_{i % 20}" for i in range(N)],
    "value": np.random.uniform(0, 1000, N),
    "active": [i % 3 == 0 for i in range(N)],
})

grouped_pd = pd.DataFrame({
    "group": [f"group_{i % 5}" for i in range(N)],
    "value": np.random.uniform(0, 1000, N),
    "priority": np.random.randint(0, 10, N),
})

# Pre-build Polars DataFrames (no conversion cost in timing)
numeric_pl = pl.DataFrame(numeric_pd)
mixed_pl = pl.DataFrame(mixed_pd)
grouped_pl = pl.DataFrame(grouped_pd)

print("DataFrames built.\n")

# --- Polars (pre-built) ---
t1 = measure(lambda: numeric_pl.sort("value"))
print(f"  1. Numeric single col:     {t1:.2f}ms")

t2 = measure(lambda: numeric_pl.sort(["value", "score"], descending=[False, True]))
print(f"  2. Numeric multi col:      {t2:.2f}ms")

t3 = measure(lambda: mixed_pl.sort("name"))
print(f"  3. String single col:      {t3:.2f}ms")

t4 = measure(lambda: mixed_pl.sort(["category", "value"], descending=[False, True]))
print(f"  4. Mixed types multi col:  {t4:.2f}ms")

t5 = measure(lambda: grouped_pl.sort(["group", "value"], descending=[False, True]))
print(f"  5. Grouped sort:           {t5:.2f}ms")

weighted = (t1 * 2 + t2 * 2 + t3 + t4 + t5) / 7
print(f"\n  Polars weighted avg:       {weighted:.2f}ms")

# --- Polars with DataFrame creation (matches original benchmark) ---
print("\n  --- With DataFrame creation (original benchmark style) ---")
t1c = measure(lambda: pl.DataFrame(numeric_pd).sort("value"))
t2c = measure(lambda: pl.DataFrame(numeric_pd).sort(["value", "score"], descending=[False, True]))
t3c = measure(lambda: pl.DataFrame(mixed_pd).sort("name"))
t4c = measure(lambda: pl.DataFrame(mixed_pd).sort(["category", "value"], descending=[False, True]))
t5c = measure(lambda: pl.DataFrame(grouped_pd).sort(["group", "value"], descending=[False, True]))
weighted_c = (t1c * 2 + t2c * 2 + t3c + t4c + t5c) / 7
print(f"  Polars+creation weighted:  {weighted_c:.2f}ms")

print(f"\n  Prior benchmark value:     57.35ms")
print()
