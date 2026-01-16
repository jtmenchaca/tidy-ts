#!/usr/bin/env python3

import pandas as pd
import polars as pl
import numpy as np
import time
import json
import sys
import os
import warnings
import logging

# Suppress warnings for cleaner output
warnings.filterwarnings('ignore', category=FutureWarning)
warnings.filterwarnings('ignore', category=DeprecationWarning)

# Configure Polars for consistent performance
os.environ['POLARS_MAX_THREADS'] = '4'  # Control thread count for consistency
pl.Config.set_tbl_rows(-1)  # Show all rows

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

# Configuration
SIZES = [500000]
ITERATIONS = 7
WARMUP_RUNS = 5

# Boolean flags to enable/disable specific operations
OPTIONS = {
    'creation': True,
    'filter': True,
    'select': True,
    'sort': True,
    'mutate': True,
    'distinct': True,
    'groupBy': True,
    'summarize': True,
    'innerJoin': True,
    'leftJoin': True,
    'outerJoin': True,
    'pivotLonger': True,
    'pivotWider': True,
    'bindRows': True,
    'stats': True,
}

def generate_data(size):
    """Generate test data for a given size with optimized types"""
    np.random.seed(42)
    df = pd.DataFrame({
        'id': range(size),
        'value': np.random.uniform(0, 1000, size),
        'category': [f'category_{i % 20}' for i in range(size)],
        'score': np.random.uniform(0, 100, size),
        'active': [i % 3 == 0 for i in range(size)]
    })
    # Set categorical dtype for string-like groups for better performance
    df['category'] = df['category'].astype('category')
    return df

def generate_join_data(size):
    """Generate test data for join operations with optimized types"""
    np.random.seed(42)
    left_data = pd.DataFrame({
        'id': range(size),
        'value_a': np.random.uniform(0, 1000, size),
        'category': [['A', 'B', 'C'][i % 3] for i in range(size)]
    })
    left_data['category'] = left_data['category'].astype('category')
    
    right_size = int(size * 0.8)
    right_data = pd.DataFrame({
        'id': np.random.randint(0, size, right_size),
        'value_b': np.random.uniform(0, 1000, right_size),
        'status': [['active', 'pending', 'complete'][i % 3] for i in range(right_size)]
    })
    right_data['status'] = right_data['status'].astype('category')
    
    return left_data, right_data

def generate_pivot_data(size):
    """Generate test data for pivot operations with optimized types"""
    np.random.seed(42)
    df = pd.DataFrame({
        'id': range(size),
        'region': [f'region_{i % 5}' for i in range(size)],
        'product': [f'product_{i % 10}' for i in range(size)],
        'q1': np.random.randint(0, 1000, size),
        'q2': np.random.randint(0, 1000, size),
        'q3': np.random.randint(0, 1000, size),
        'q4': np.random.randint(0, 1000, size)
    })
    df['region'] = df['region'].astype('category')
    df['product'] = df['product'].astype('category')
    return df

def log_dataset_head(df, operation_name, library_name):
    """Log the first 5 rows of a dataset after an operation"""
    try:
        if hasattr(df, 'head') and hasattr(df, 'to_string'):  # Pandas DataFrame
            logger.info(f"\n{operation_name} - {library_name} (first 5 rows):")
            logger.info(f"{df.head().to_string()}")
        elif hasattr(df, 'limit'):  # Polars DataFrame
            logger.info(f"\n{operation_name} - {library_name} (first 5 rows):")
            logger.info(f"{df.limit(5)}")
        else:
            logger.info(f"\n{operation_name} - {library_name} (first 5 rows):")
            logger.info(f"{str(df)[:500]}...")  # Fallback for other types
    except Exception as e:
        logger.info(f"\n{operation_name} - {library_name} (error logging): {e}")

def measure_operation(func, iterations=ITERATIONS, warmup=WARMUP_RUNS, log_result=False, operation_name="", library_name=""):
    """Measure a single operation with improved warmup and median calculation"""
    # Warm up
    for _ in range(warmup):
        func()
    
    times = []
    result = None
    for i in range(iterations):
        start = time.perf_counter()
        result = func()
        end = time.perf_counter()
        times.append((end - start) * 1000)  # Convert to milliseconds
    
    times.sort()
    
    # Log result if requested
    if log_result and result is not None:
        log_dataset_head(result, operation_name, library_name)
    
    # Return median of last N-1 runs (excluding first run after warmup)
    if len(times) > 1:
        return times[len(times) // 2]  # Return median
    else:
        return times[0]

def run_python_benchmarks():
    """Run all Python benchmarks (pandas vs polars)"""
    print("Running Python benchmarks (pandas vs polars)...\n", file=sys.stderr)
    
    results = {}
    
    for size in SIZES:
        print(f"  Testing {size:,} rows...", file=sys.stderr)
        data = generate_data(size)
        left_data, right_data = generate_join_data(size)
        pivot_data = generate_pivot_data(size)
        
        # Prebuild DataFrames for consistent performance
        print("    - Prebuilding DataFrames...", file=sys.stderr)
        pd_df = data.copy()
        pl_df = pl.DataFrame(data)
        pl_df = pl_df.with_columns(pl.col('category').cast(pl.Categorical))
        
        # Prebuild join DataFrames
        pd_left = left_data.copy()
        pd_right = right_data.copy()
        pl_left = pl.DataFrame(left_data)
        pl_right = pl.DataFrame(right_data)
        pl_left = pl_left.with_columns(pl.col('category').cast(pl.Categorical))
        pl_right = pl_right.with_columns(pl.col('status').cast(pl.Categorical))
        
        # Prebuild pivot DataFrames
        pd_pivot = pivot_data.copy()
        pl_pivot = pl.DataFrame(pivot_data)
        pl_pivot = pl_pivot.with_columns([
            pl.col('region').cast(pl.Categorical),
            pl.col('product').cast(pl.Categorical)
        ])
        
        # Prebuild split DataFrames for bindRows
        df1_pd = data.iloc[:len(data)//2].copy()
        df2_pd = data.iloc[len(data)//2:].copy()
        df1_pl = pl.DataFrame(data.iloc[:len(data)//2])
        df2_pl = pl.DataFrame(data.iloc[len(data)//2:])
        df1_pl = df1_pl.with_columns(pl.col('category').cast(pl.Categorical))
        df2_pl = df2_pl.with_columns(pl.col('category').cast(pl.Categorical))
        
        print("    - DataFrames prebuilt", file=sys.stderr)
        
        size_results = {}
        
        # DataFrame Creation
        if OPTIONS['creation']:
            pandas_time = measure_operation(lambda: pd.DataFrame(data.to_dict()), log_result=True, operation_name="DataFrame Creation", library_name="pandas")
            polars_time = measure_operation(lambda: pl.DataFrame(data), log_result=True, operation_name="DataFrame Creation", library_name="polars")
            size_results['creation'] = {
                'pandas': pandas_time,
                'polars': polars_time,
                'ratio': pandas_time / polars_time
            }
        
        # Filter Operations (3 tests with weighted averaging)
        if OPTIONS['filter']:
            # Test 1: Simple numeric filtering
            pandas_numeric = measure_operation(lambda: pd_df[pd_df['value'] > 500], log_result=True, operation_name="Filter (numeric)", library_name="pandas")
            polars_numeric = measure_operation(lambda: pl_df.filter(pl.col('value') > 500), log_result=True, operation_name="Filter (numeric)", library_name="polars")
            
            # Test 2: String filtering
            pandas_string = measure_operation(lambda: pd_df[pd_df['category'] == 'category_5'], log_result=True, operation_name="Filter (string)", library_name="pandas")
            polars_string = measure_operation(lambda: pl_df.filter(pl.col('category') == 'category_5'), log_result=True, operation_name="Filter (string)", library_name="polars")
            
            # Test 3: Complex filtering
            pandas_complex = measure_operation(lambda: pd_df.loc[(pd_df['value'] > 300) & (pd_df['score'] > 50) & pd_df['active']], log_result=True, operation_name="Filter (complex)", library_name="pandas")
            polars_complex = measure_operation(lambda: pl_df.filter((pl.col('value') > 300) & (pl.col('score') > 50) & pl.col('active')), log_result=True, operation_name="Filter (complex)", library_name="polars")
            
            # Weighted average
            avg_pandas = (pandas_numeric * 2 + pandas_string + pandas_complex) / 4
            avg_polars = (polars_numeric * 2 + polars_string + polars_complex) / 4
            
            size_results['filter'] = {
                'pandas': avg_pandas,
                'polars': avg_polars,
                'ratio': avg_pandas / avg_polars
            }
        
        # Select Columns
        if OPTIONS['select']:
            pandas_time = measure_operation(lambda: pd_df[['id', 'value', 'category']], log_result=True, operation_name="Select Columns", library_name="pandas")
            polars_time = measure_operation(lambda: pl_df.select(['id', 'value', 'category']), log_result=True, operation_name="Select Columns", library_name="polars")
            size_results['select'] = {
                'pandas': pandas_time,
                'polars': polars_time,
                'ratio': pandas_time / polars_time
            }
        
        # Sort Operations (5 tests with weighted averaging)
        if OPTIONS['sort']:
            # Generate specific test data for different sort scenarios
            numeric_data = pd.DataFrame({
                'value': np.random.uniform(0, 1000, size),
                'date': pd.to_datetime([f'2020-{np.random.randint(1,13):02d}-{np.random.randint(1,29):02d}' for _ in range(size)]),
                'score': [np.random.uniform(0, 100) if i % 10 != 0 else None for i in range(size)]
            })
            
            mixed_data = pd.DataFrame({
                'name': [f'name_{i % 100}' for i in range(size)],
                'category': [f'category_{i % 20}' for i in range(size)],
                'value': np.random.uniform(0, 1000, size),
                'active': [i % 3 == 0 for i in range(size)]
            })
            
            grouped_data = pd.DataFrame({
                'group': [f'group_{i % 5}' for i in range(size)],
                'value': np.random.uniform(0, 1000, size),
                'priority': np.random.randint(0, 10, size)
            })
            
            # Test 1: Numeric Fast Path
            pandas_numeric = measure_operation(lambda: numeric_data.sort_values('value'))
            polars_numeric = measure_operation(lambda: pl.DataFrame(numeric_data).sort('value'))
            
            # Test 2: Multi-column Numeric Fast Path
            pandas_multi_numeric = measure_operation(lambda: numeric_data.sort_values(['value', 'score'], ascending=[True, False]))
            polars_multi_numeric = measure_operation(lambda: pl.DataFrame(numeric_data).sort(['value', 'score'], descending=[False, True]))
            
            # Test 3: String Stable Path
            pandas_string = measure_operation(lambda: mixed_data.sort_values('name'))
            polars_string = measure_operation(lambda: pl.DataFrame(mixed_data).sort('name'))
            
            # Test 4: Mixed Types Stable Path
            pandas_mixed = measure_operation(lambda: mixed_data.sort_values(['category', 'value'], ascending=[True, False]))
            polars_mixed = measure_operation(lambda: pl.DataFrame(mixed_data).sort(['category', 'value'], descending=[False, True]))
            
            # Test 5: Grouped Data Stable Path
            pandas_grouped = measure_operation(lambda: grouped_data.groupby('group')['value'].apply(lambda x: x.sort_values(ascending=False)))
            polars_grouped = measure_operation(lambda: pl.DataFrame(grouped_data).sort(['group', 'value'], descending=[False, True]))
            
            # Weighted average
            avg_pandas = (pandas_numeric * 2 + pandas_multi_numeric * 2 + pandas_string + pandas_mixed + pandas_grouped) / 7
            avg_polars = (polars_numeric * 2 + polars_multi_numeric * 2 + polars_string + polars_mixed + polars_grouped) / 7
            
            size_results['sort'] = {
                'pandas': avg_pandas,
                'polars': avg_polars,
                'ratio': avg_pandas / avg_polars
            }
        
        # Mutate Operations
        if OPTIONS['mutate']:
            pandas_time = measure_operation(lambda: pd_df.assign(score_pct=pd_df['score'] / 100), log_result=True, operation_name="Mutate", library_name="pandas")
            polars_time = measure_operation(lambda: pl_df.with_columns((pl.col('score') / 100).alias('score_pct')), log_result=True, operation_name="Mutate", library_name="polars")
            size_results['mutate'] = {
                'pandas': pandas_time,
                'polars': polars_time,
                'ratio': pandas_time / polars_time
            }
        
        # Distinct Operations
        if OPTIONS['distinct']:
            pandas_time = measure_operation(lambda: pd_df.drop_duplicates(), log_result=True, operation_name="Distinct", library_name="pandas")
            polars_time = measure_operation(lambda: pl_df.unique(), log_result=True, operation_name="Distinct", library_name="polars")
            size_results['distinct'] = {
                'pandas': pandas_time,
                'polars': polars_time,
                'ratio': pandas_time / polars_time
            }
        
        # Group By Operations (3 tests with weighted averaging)
        if OPTIONS['groupBy']:
            # Test 1: Single column grouping
            pandas_single = measure_operation(lambda: pd_df.groupby('category', observed=True).size(), log_result=True, operation_name="GroupBy (single)", library_name="pandas")
            polars_single = measure_operation(lambda: pl_df.group_by('category').len(), log_result=True, operation_name="GroupBy (single)", library_name="polars")
            
            # Test 2: Multiple column grouping
            pandas_multi = measure_operation(lambda: pd_df.groupby(['category', 'active'], observed=True).size(), log_result=True, operation_name="GroupBy (multi)", library_name="pandas")
            polars_multi = measure_operation(lambda: pl_df.group_by(['category', 'active']).len(), log_result=True, operation_name="GroupBy (multi)", library_name="polars")
            
            # Test 3: High cardinality grouping
            pandas_high_card = measure_operation(lambda: pd_df.groupby('id').size(), log_result=True, operation_name="GroupBy (high cardinality)", library_name="pandas")
            polars_high_card = measure_operation(lambda: pl_df.group_by('id').len(), log_result=True, operation_name="GroupBy (high cardinality)", library_name="polars")
            
            # Weighted average
            avg_pandas = (pandas_single * 2 + pandas_multi * 2 + pandas_high_card) / 5
            avg_polars = (polars_single * 2 + polars_multi * 2 + polars_high_card) / 5
            
            size_results['groupBy'] = {
                'pandas': avg_pandas,
                'polars': avg_polars,
                'ratio': avg_pandas / avg_polars
            }
        
        # Summarize Operations (3 tests with weighted averaging)
        if OPTIONS['summarize']:
            # Test 1: Ungrouped summarization
            pandas_ungrouped = measure_operation(lambda: pd_df.agg({
                'id': 'count',
                'value': ['mean', 'sum']
            }).reset_index(), log_result=True, operation_name="Summarize (ungrouped)", library_name="pandas")
            polars_ungrouped = measure_operation(lambda: pl_df.select([
                pl.count('id').alias('count'),
                pl.mean('value').alias('avg_value'),
                pl.sum('value').alias('total_value')
            ]), log_result=True, operation_name="Summarize (ungrouped)", library_name="polars")
            
            # Test 2: Grouped summarization
            pandas_grouped = measure_operation(lambda: pd_df.groupby('category', observed=True).agg({
                'id': 'count',
                'value': ['mean', 'sum']
            }).reset_index(), log_result=True, operation_name="Summarize (grouped)", library_name="pandas")
            polars_grouped = measure_operation(lambda: pl_df.group_by('category').agg([
                pl.count('id').alias('count'),
                pl.mean('value').alias('avg_value'),
                pl.sum('value').alias('total_value')
            ]), log_result=True, operation_name="Summarize (grouped)", library_name="polars")
            
            # Test 3: Complex grouped summarization
            pandas_complex = measure_operation(lambda: pd_df.groupby(['category', 'active'], observed=True).agg({
                'id': 'count',
                'value': 'mean',
                'score': 'mean'
            }).reset_index(), log_result=True, operation_name="Summarize (complex)", library_name="pandas")
            polars_complex = measure_operation(lambda: pl_df.group_by(['category', 'active']).agg([
                pl.count('id').alias('count'),
                pl.mean('value').alias('avg_value'),
                pl.mean('score').alias('avg_score')
            ]), log_result=True, operation_name="Summarize (complex)", library_name="polars")
            
            # Weighted average
            avg_pandas = (pandas_ungrouped + pandas_grouped * 2 + pandas_complex) / 4
            avg_polars = (polars_ungrouped + polars_grouped * 2 + polars_complex) / 4
            
            size_results['summarize'] = {
                'pandas': avg_pandas,
                'polars': avg_polars,
                'ratio': avg_pandas / avg_polars
            }
        
        # Inner Join Operations
        if OPTIONS['innerJoin']:
            pandas_time = measure_operation(lambda: pd_left.merge(pd_right, on='id', how='inner'), log_result=True, operation_name="Inner Join", library_name="pandas")
            polars_time = measure_operation(lambda: pl_left.join(pl_right, on='id', how='inner'), log_result=True, operation_name="Inner Join", library_name="polars")
            size_results['innerJoin'] = {
                'pandas': pandas_time,
                'polars': polars_time,
                'ratio': pandas_time / polars_time
            }
        
        # Left Join Operations
        if OPTIONS['leftJoin']:
            pandas_time = measure_operation(lambda: pd_left.merge(pd_right, on='id', how='left'), log_result=True, operation_name="Left Join", library_name="pandas")
            polars_time = measure_operation(lambda: pl_left.join(pl_right, on='id', how='left'), log_result=True, operation_name="Left Join", library_name="polars")
            size_results['leftJoin'] = {
                'pandas': pandas_time,
                'polars': polars_time,
                'ratio': pandas_time / polars_time
            }
        
        # Outer Join Operations
        if OPTIONS['outerJoin']:
            pandas_time = measure_operation(lambda: pd_left.merge(pd_right, on='id', how='outer'), log_result=True, operation_name="Outer Join", library_name="pandas")
            polars_time = measure_operation(lambda: pl_left.join(pl_right, on='id', how='full'), log_result=True, operation_name="Outer Join", library_name="polars")
            size_results['outerJoin'] = {
                'pandas': pandas_time,
                'polars': polars_time,
                'ratio': pandas_time / polars_time
            }
        
        # Pivot Longer Operations (wide to long)
        if OPTIONS['pivotLonger']:
            pandas_time = measure_operation(lambda: pd_pivot.melt(
                id_vars=['id', 'region', 'product'],
                value_vars=['q1', 'q2', 'q3', 'q4'],
                var_name='quarter',
                value_name='sales'
            ), log_result=True, operation_name="Pivot Longer", library_name="pandas")
            polars_time = measure_operation(lambda: pl_pivot.unpivot(
                index=['id', 'region', 'product'],
                on=['q1', 'q2', 'q3', 'q4'],
                variable_name='quarter',
                value_name='sales'
            ), log_result=True, operation_name="Pivot Longer", library_name="polars")
            size_results['pivotLonger'] = {
                'pandas': pandas_time,
                'polars': polars_time,
                'ratio': pandas_time / polars_time
            }
        
        # Pivot Wider Operations (long to wide)
        if OPTIONS['pivotWider']:
            # Create long format data for pivot wider test
            long_data_size = min(size, 10000)
            long_data = pd.DataFrame({
                'id': [i // 4 for i in range(long_data_size * 4)],
                'region': [f'region_{(i // 4) % 5}' for i in range(long_data_size * 4)],
                'quarter': ['q1', 'q2', 'q3', 'q4'] * long_data_size,
                'sales': np.random.uniform(0, 1000, long_data_size * 4)
            })
            long_data['region'] = long_data['region'].astype('category')
            long_data['quarter'] = long_data['quarter'].astype('category')
            
            # Prebuild long DataFrames
            pd_long = long_data.copy()
            pl_long = pl.DataFrame(long_data)
            pl_long = pl_long.with_columns([
                pl.col('region').cast(pl.Categorical),
                pl.col('quarter').cast(pl.Categorical)
            ])
            
            pandas_time = measure_operation(lambda: pd_long.pivot_table(
                index=['id', 'region'],
                columns='quarter',
                values='sales',
                aggfunc='first',
                observed=True
            ).reset_index(), log_result=True, operation_name="Pivot Wider", library_name="pandas")
            
            polars_time = measure_operation(lambda: pl_long.pivot(
                index=['id', 'region'],
                on='quarter',
                values='sales',
                aggregate_function='first'
            ), log_result=True, operation_name="Pivot Wider", library_name="polars")
            
            size_results['pivotWider'] = {
                'pandas': pandas_time,
                'polars': polars_time,
                'ratio': pandas_time / polars_time
            }
        
        # Bind Rows Operations
        if OPTIONS['bindRows']:
            pandas_time = measure_operation(lambda: pd.concat([df1_pd, df2_pd]), log_result=True, operation_name="Bind Rows", library_name="pandas")
            polars_time = measure_operation(lambda: pl.concat([df1_pl, df2_pl]), log_result=True, operation_name="Bind Rows", library_name="polars")
            size_results['bindRows'] = {
                'pandas': pandas_time,
                'polars': polars_time,
                'ratio': pandas_time / polars_time
            }
        
        # Statistical Functions
        if OPTIONS['stats']:
            pandas_time = measure_operation(lambda: pd_df['value'].agg([
                'sum', 'mean', 'median', 'var', 'std', 'nunique'
            ]), log_result=True, operation_name="Statistical Functions", library_name="pandas")
            polars_time = measure_operation(lambda: pl_df.select([
                pl.col('value').sum().alias('sum'),
                pl.col('value').mean().alias('mean'),
                pl.col('value').median().alias('median'),
                pl.col('value').var().alias('variance'),
                pl.col('value').std().alias('stdev'),
                pl.col('value').n_unique().alias('unique')
            ]), log_result=True, operation_name="Statistical Functions", library_name="polars")
            size_results['stats'] = {
                'pandas': pandas_time,
                'polars': polars_time,
                'ratio': pandas_time / polars_time
            }
        
        results[size] = size_results
    
    print("Python benchmarks completed!\n", file=sys.stderr)
    return results

if __name__ == "__main__":
    try:
        results = run_python_benchmarks()
        print(json.dumps(results, indent=2))
    except Exception as e:
        print(f"❌ Python benchmark failed: {e}")
        sys.exit(1)
