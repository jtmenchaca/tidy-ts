#!/usr/bin/env python3

import pandas as pd
import polars as pl
import numpy as np
import time

# Configuration
SIZE = 10_000_000
ITERATIONS = 3

def generate_join_data(size):
    """Generate test data for join operations (matching TypeScript pattern)"""
    np.random.seed(42)
    
    # Left data: 1-based indexing, sequential IDs
    left_data = pd.DataFrame({
        'id': range(1, size + 1),  # 1-based indexing to match TypeScript
        'value_a': np.random.uniform(0, 1000, size),
        'category': [['A', 'B', 'C'][i % 3] for i in range(size)]
    })
    
    # Right data: 80% of size, random IDs from 1 to size
    right_size = int(size * 0.8)
    right_data = pd.DataFrame({
        'id': np.random.randint(1, size + 1, right_size),  # 1-based indexing
        'value_b': np.random.uniform(0, 1000, right_size),
        'status': [['active', 'pending', 'complete'][i % 3] for i in range(right_size)]
    })
    
    return left_data, right_data

def measure_operation(func, iterations=ITERATIONS):
    """Measure operation time"""
    times = []
    for _ in range(iterations):
        start = time.perf_counter()
        result = func()
        end = time.perf_counter()
        times.append((end - start) * 1000)  # Convert to milliseconds
    
    times.sort()
    return times[len(times) // 2]  # Return median

def main():
    print(f"Testing {SIZE:,} rows...")
    
    # Generate data
    print("  - Generating data...")
    left_data, right_data = generate_join_data(SIZE)
    
    # Create Polars DataFrames
    print("  - Creating Polars DataFrames...")
    pl_left = pl.DataFrame(left_data)
    pl_right = pl.DataFrame(right_data)
    
    # Create Pandas DataFrames
    print("  - Creating Pandas DataFrames...")
    pd_left = left_data.copy()
    pd_right = right_data.copy()
    
    print("  - Running benchmarks...")
    
    # Pandas left join
    pandas_time = measure_operation(
        lambda: pd_left.merge(pd_right, on='id', how='left')
    )
    
    # Polars left join
    polars_time = measure_operation(
        lambda: pl_left.join(pl_right, on='id', how='left')
    )
    
    print(f"\nResults:")
    print(f"  Pandas: {pandas_time:.2f}ms")
    print(f"  Polars: {polars_time:.2f}ms")
    print(f"  Ratio:  {pandas_time / polars_time:.2f}x")

if __name__ == "__main__":
    main()
