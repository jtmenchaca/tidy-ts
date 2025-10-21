#!/usr/bin/env python3
"""
Test memory usage of loading MIMICEL.CSV in Python with pandas
"""
import pandas as pd
import os
import sys

# File path
csv_path = "./tmp/mimicel.csv"

# Check file size
file_size_gb = os.path.getsize(csv_path) / (1024 ** 3)
print(f"File size: {file_size_gb:.2f} GB")
print()

# Load CSV
print(f"Loading CSV...")
import time
start = time.time()
df = pd.read_csv(csv_path)
load_time = time.time() - start

print(f"Load time: {load_time:.1f} seconds")
print(f"\nDataFrame info:")
print(f"  Rows: {len(df):,}")
print(f"  Columns: {len(df.columns)}")
print()

# Get memory usage from pandas
memory_bytes = df.memory_usage(deep=True).sum()
memory_mb = memory_bytes / (1024 ** 2)
memory_gb = memory_bytes / (1024 ** 3)
expansion_ratio = memory_gb / file_size_gb

print(f"Memory usage:")
print(f"  DataFrame memory: {memory_mb:.1f} MB ({memory_gb:.2f} GB)")
print(f"  Expansion ratio: {expansion_ratio:.1f}x (file size → memory)")
print()

# Show column-by-column breakdown
print("Column memory breakdown (top 10 largest):")
col_mem = df.memory_usage(deep=True).sort_values(ascending=False).head(10)
for col, mem in col_mem.items():
    print(f"  {col}: {mem / (1024**2):.1f} MB")
print()

# Show data types
print("Data types:")
print(df.dtypes.value_counts())
