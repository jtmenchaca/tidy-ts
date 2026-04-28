"""
Join benchmark comparison: Polars baseline.
Run with: python packages/testing/benchmarks/bench-join-comparison.py
"""
import time
import numpy as np
import polars as pl

N_LEFT = 500_000
N_RIGHT = 100_000
N_KEYS = 50_000
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

print(f"\nJoin benchmark — left={N_LEFT:,}, right={N_RIGHT:,}, keys={N_KEYS:,}\n")

np.random.seed(42)

# Numeric key
left_pl = pl.DataFrame({
    "id": np.random.randint(0, N_KEYS, N_LEFT).astype(np.int64),
    "value_l": np.random.uniform(0, 100, N_LEFT),
})
right_pl = pl.DataFrame({
    "id": np.random.randint(0, N_KEYS, N_RIGHT).astype(np.int64),
    "value_r": np.random.uniform(0, 100, N_RIGHT),
})

# String key
left_str_pl = pl.DataFrame({
    "key": [f"key_{np.random.randint(0, N_KEYS)}" for _ in range(N_LEFT)],
    "value_l": np.random.uniform(0, 100, N_LEFT),
})
right_str_pl = pl.DataFrame({
    "key": [f"key_{np.random.randint(0, N_KEYS)}" for _ in range(N_RIGHT)],
    "value_r": np.random.uniform(0, 100, N_RIGHT),
})

# Multi key
left_multi_pl = pl.DataFrame({
    "id_a": np.random.randint(0, 1000, N_LEFT).astype(np.int64),
    "id_b": np.random.randint(0, 50, N_LEFT).astype(np.int64),
    "value_l": np.random.uniform(0, 100, N_LEFT),
})
right_multi_pl = pl.DataFrame({
    "id_a": np.random.randint(0, 1000, N_RIGHT).astype(np.int64),
    "id_b": np.random.randint(0, 50, N_RIGHT).astype(np.int64),
    "value_r": np.random.uniform(0, 100, N_RIGHT),
})

print("DataFrames built.\n")

t1 = measure(lambda: left_pl.join(right_pl, on="id", how="inner"))
print(f"  1. Inner join (numeric key):    {t1:.2f}ms")

t2 = measure(lambda: left_pl.join(right_pl, on="id", how="left"))
print(f"  2. Left join (numeric key):     {t2:.2f}ms")

t3 = measure(lambda: left_str_pl.join(right_str_pl, on="key", how="inner"))
print(f"  3. Inner join (string key):     {t3:.2f}ms")

t4 = measure(lambda: left_str_pl.join(right_str_pl, on="key", how="left"))
print(f"  4. Left join (string key):      {t4:.2f}ms")

t5 = measure(lambda: left_multi_pl.join(right_multi_pl, on=["id_a", "id_b"], how="inner"))
print(f"  5. Inner join (2-col key):      {t5:.2f}ms")

t6 = measure(lambda: left_multi_pl.join(right_multi_pl, on=["id_a", "id_b"], how="left"))
print(f"  6. Left join (2-col key):       {t6:.2f}ms")

avg = (t1 + t2 + t3 + t4 + t5 + t6) / 6
print(f"\n  Average:                        {avg:.2f}ms")
