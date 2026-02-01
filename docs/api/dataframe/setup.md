# Setup

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [setupTidyTS](#setuptidyts)
- [DataFrame Architecture](#dataframe-architecture)

---

## setupTidyTS

Setup function for browsers - preload and compile the WebAssembly module that powers statistical computations. Call this once before using any tidy-ts statistical or WASM-backed functions in browsers. In Node.js/Deno/Bun environments, this is a no-op as they load WASM synchronously on demand.

### Signature

```typescript
setupTidyTS(url?: string | URL): Promise<void>
```

### Import

```typescript
import { setupTidyTS, createDataFrame, stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- url?: string | URL - Optional URL or path to the tidy_ts_dataframe.wasm file. If omitted, automatically resolves the URL relative to the package location. Useful for custom CDN paths or local hosting scenarios.

### Returns

Promise<void> - Resolves when the WASM module is compiled and ready

### Examples

```typescript
// BROWSER SETUP - Call once before using stats functions
import { setupTidyTS, createDataFrame, stats as s } from "@tidy-ts/dataframe";

// Initialize WASM (required in browsers, no-op elsewhere)
await setupTidyTS();

// Now you can use all tidy-ts features
const df = createDataFrame([{ x: 1 }, { x: 2 }, { x: 3 }]);
const meanValue = s.mean(df.x);
// HTML EXAMPLE - Complete browser setup
<!DOCTYPE html>
<html>
<head>
  <script type="importmap">
    { "imports": { "@tidy-ts/dataframe": "https://esm.sh/@tidy-ts/dataframe" } }
  </script>
</head>
<body>
  <script type="module">
    import { setupTidyTS, createDataFrame, stats as s } from "@tidy-ts/dataframe";

    async function main() {
      // Required: Initialize WASM before using stats
      await setupTidyTS();

      const df = createDataFrame([
        { name: "Alice", score: 85 },
        { name: "Bob", score: 92 },
        { name: "Charlie", score: 78 },
      ]);

      console.log("Mean score:", s.mean(df.score));
      df.print();
    }
    main();
  </script>
</body>
</html>
// REACT/VITE EXAMPLE - Setup in app initialization
import { useEffect, useState } from "react";
import { setupTidyTS, createDataFrame, stats as s } from "@tidy-ts/dataframe";

function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setupTidyTS().then(() => setReady(true));
  }, []);

  if (!ready) return <div>Loading...</div>;

  // Now safe to use tidy-ts stats functions
  const df = createDataFrame([{ value: 10 }, { value: 20 }]);
  return <div>Mean: {s.mean(df.value)}</div>;
}
// Custom WASM URL (CDN or local hosting)
await setupTidyTS("https://cdn.example.com/tidy_ts_dataframe.wasm");

// Local path
await setupTidyTS("/static/wasm/tidy_ts_dataframe.wasm");
// ERROR HANDLING
try {
  await setupTidyTS();
} catch (error) {
  console.error("Failed to load WASM:", error);
  // Fallback: some operations work without WASM
}
```

### Best Practices

- ✓ GOOD: Call setupTidyTS() once at app initialization before using stats functions
- ✓ GOOD: The function is idempotent - calling it multiple times is safe (subsequent calls are no-ops)
- ✓ GOOD: Use try/catch for graceful error handling if WASM fails to load
- ✓ GOOD: In Node.js/Deno/Bun, setupTidyTS() is a no-op - safe to include unconditionally
- ✓ GOOD: For custom deployments, pass the WASM URL as a parameter

### Anti-patterns

- ❌ BAD: Using s.mean(), s.stdev(), or other WASM-backed stats functions before calling setupTidyTS() in browsers - will throw an error
- ❌ BAD: Calling setupTidyTS() in a loop or on every component render - call once at app initialization

### Related

`createDataFrame`, `s.mean`, `s.stdev`

---

## DataFrame Architecture

Tidy-TS DataFrames use a columnar storage architecture for high performance. Data is stored column-by-column (not row-by-row), enabling vectorized operations and better cache locality. Filtering uses lazy BitSet masks instead of copying data, and transformations use copy-on-write semantics. Performance-critical operations like joins, sorting, and statistical tests are compiled to WebAssembly (Rust).

### Signature

```typescript
Columnar Storage + BitSet Masks + Copy-on-Write + WASM
```

### Import

```typescript
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
```

### Returns

High-performance DataFrame operations

### Examples

```typescript
// COLUMNAR STORAGE
// Data is stored by column, not by row
// This enables vectorized operations and better cache locality
const df = createDataFrame([
  { x: 1, y: 10 },
  { x: 2, y: 20 },
  { x: 3, y: 30 },
]);

// Internally stored as:
// columns: { x: [1, 2, 3], y: [10, 20, 30] }
// Not as: [{ x: 1, y: 10 }, { x: 2, y: 20 }, { x: 3, y: 30 }]

// Column access is O(1) - direct array access
const xValues = df.x;  // Returns the x column array directly
// LAZY BITSET FILTERING
// filter() does NOT copy data - it creates a BitSet mask
const df = createDataFrame([
  { id: 1, status: "active" },
  { id: 2, status: "inactive" },
  { id: 3, status: "active" },
]);

// This is O(n) to evaluate, but does NOT copy the data
const active = df.filter(r => r.status === "active");

// Chained filters combine masks with bitwise AND
// Still no data copying - just mask operations
const result = df
  .filter(r => r.status === "active")
  .filter(r => r.id > 1);

// Data is only materialized when you access it
result.print();  // Now the mask is applied
// COPY-ON-WRITE SEMANTICS
// Modifications create new columns only for changed data
const df = createDataFrame([{ x: 1 }, { x: 2 }, { x: 3 }]);

// mutate() creates a new column, but x column is shared (not copied)
const df2 = df.mutate({ y: r => r.x * 2 });

// Original df is unchanged (immutable)
console.log(df.columns());   // ["x"]
console.log(df2.columns());  // ["x", "y"]

// Memory efficient: x array is shared between df and df2
// WASM-POWERED OPERATIONS
// Performance-critical operations run in WebAssembly (Rust)
// - Joins: innerJoin, leftJoin, rightJoin, outerJoin
// - Sorting: arrange() with complex multi-column sorts
// - Statistics: mean, stdev, variance, correlation, t-tests
// - Regression: GLM, linear models
// - Distributions: normal, t, chi-square, etc.

// Example: WASM-powered join (4-8x faster than pure JS)
const orders = createDataFrame([...]);
const customers = createDataFrame([...]);
const result = orders.leftJoin(customers, "customer_id");
// PERFORMANCE TIPS

// 1. Column access is fast - prefer df.columnName over toArray()
const values = df.x;  // Fast: direct column access
// vs
const slow = df.toArray().map(r => r.x);  // Slow: row reconstruction

// 2. Chained filters are efficient - they combine masks
df.filter(r => r.a > 0).filter(r => r.b < 10);  // Two masks combined

// 3. Use WASM-powered functions for large datasets
s.mean(df.x);      // WASM: fast for large arrays
df.leftJoin(...);  // WASM: optimized hash join
df.arrange("x");   // WASM: optimized sort

// 4. extract() for stats functions that need arrays
const result = s.test.t.oneSample({
  x: df.extract("measurement"),
  mu: 100
});
```

### Best Practices

- ✓ COLUMNAR STORAGE: Data stored by column for cache-efficient vectorized operations
- ✓ LAZY FILTERING: filter() creates BitSet masks instead of copying data - multiple filters combine with bitwise AND
- ✓ COPY-ON-WRITE: Transformations share unchanged columns between DataFrames for memory efficiency
- ✓ WASM ACCELERATION: Joins, sorting, and stats run in WebAssembly (Rust) for 4-8x speedup on large datasets
- ✓ PREFER COLUMN ACCESS: Use df.columnName instead of df.toArray() for better performance
- ✓ USE extract(): Use df.extract('column') to get arrays for statistical functions

### Related

`createDataFrame`, `filter`, `mutate`, `leftJoin`, `arrange`

---
