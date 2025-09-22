# Benchmarks V2 - Simplified Structure

This is a simplified benchmark suite with **3 files total** - one per language, where each operation is measured across all libraries in that language.

## Structure

```
benchmarksV2/
├── README.md           # This file
├── typescript.ts       # tidy-ts vs Arquero benchmarks
├── python.py           # pandas vs polars benchmarks  
├── r.R                 # R base benchmarks
├── runner.ts           # Main runner that executes all three
└── results/            # Generated results
    └── latest.json     # (generated when run)
```

## Key Features

- **3 files total**: One per language (TypeScript, Python, R)
- **Cross-library comparison**: Each operation measured in all libraries for that language
- **Boolean flags**: Control which operations run via `OPTIONS` in each file
- **Weighted averaging**: Complex operations use multiple test scenarios with weighted averages
- **Consistent measurement**: Same data generation and timing across all languages

## Usage

### Run All Benchmarks
```bash
deno run runner.ts
```

### Run Individual Languages
```bash
# TypeScript (tidy-ts vs Arquero)
deno run typescript.ts

# Python (pandas vs polars)  
python3 python.py

# R (R base)
Rscript r.R
```

### Configure Operations
Edit the `OPTIONS` object in each file to enable/disable specific operations:

**TypeScript (`typescript.ts`):**
```typescript
const OPTIONS = {
  creation: true,
  filter: true,
  select: false,    // Disabled
  sort: true,
  // ... etc
};
```

**Python (`python.py`):**
```python
OPTIONS = {
    'creation': True,
    'filter': True,
    'select': False,    # Disabled
    'sort': True,
    # ... etc
}
```

**R (`r.R`):**
```r
OPTIONS <- list(
  creation = TRUE,
  filter = TRUE,
  select = FALSE,    # Disabled
  sort = TRUE,
  # ... etc
)
```

## Available Operations

- **creation**: DataFrame creation from raw data
- **filter**: Row filtering operations (3 tests: numeric, string, complex)
- **select**: Column selection
- **sort**: Row sorting (5 tests: numeric fast path, multi-numeric, string stable, mixed types, grouped)
- **mutate**: Column creation/modification
- **distinct**: Duplicate removal
- **groupBy**: Data grouping (3 tests: single column, multiple columns, high cardinality)
- **summarize**: Aggregation and summary statistics (3 tests: ungrouped, grouped, complex grouped)
- **innerJoin**: Inner join operations
- **leftJoin**: Left join operations
- **outerJoin**: Outer join operations
- **pivot**: Data reshaping (pivot_longer/pivot_wider)
- **bindRows**: Row binding and concatenation
- **stats**: Statistical functions

## Dataset Sizes

Default sizes: 100, 1,000, 10,000, 100,000, 1,000,000 rows

Configure in each file:
- **TypeScript**: `const SIZES = [100, 1000, 10000, 100000, 1000000] as const;`
- **Python**: `SIZES = [100, 1000, 10000, 100000, 1000000]`
- **R**: `SIZES <- c(100, 1000, 10000, 100000, 1000000)`

## Output

Results are saved as JSON in `results/latest.json` with the following structure:

```json
{
  "typescript": {
    "100": {
      "creation": { "tidy": 0.1, "arquero": 0.2, "ratio": 0.5 },
      "filter": { "tidy": 0.3, "arquero": 0.4, "ratio": 0.75 },
      // ... etc
    },
    "1000": { /* ... */ }
  },
  "python": {
    "100": {
      "creation": { "pandas": 0.1, "polars": 0.2, "ratio": 0.5 },
      "filter": { "pandas": 0.3, "polars": 0.4, "ratio": 0.75 },
      // ... etc
    }
  },
  "r": {
    "100": {
      "creation": { "r": 0.1, "ratio": 1.0 },
      "filter": { "r": 0.3, "ratio": 1.0 },
      // ... etc
    }
  }
}
```

## Requirements

- **TypeScript**: tidy-ts and arquero packages
- **Python**: pandas and polars packages (`pip install pandas polars`)
- **R**: dplyr, tidyr, and jsonlite packages (`install.packages(c("dplyr", "tidyr", "jsonlite"))`)

## Performance Notes

- **Weighted averaging**: Complex operations (filter, sort, groupBy, summarize) use multiple test scenarios with weighted averages to better represent real-world usage
- **Consistent data**: All languages use the same data generation patterns for fair comparison
- **Median timing**: Uses median of multiple iterations to reduce noise
- **Warm-up runs**: Includes warm-up runs before timing to ensure fair comparison
