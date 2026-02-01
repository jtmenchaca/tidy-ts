import type { DocEntry } from "../mcp-types.ts";

export const setupDocs: Record<string, DocEntry> = {
  setupTidyTS: {
    name: "setupTidyTS",
    category: "dataframe",
    signature: "setupTidyTS(url?: string | URL): Promise<void>",
    description:
      "Setup function for browsers - preload and compile the WebAssembly module that powers statistical computations. Call this once before using any tidy-ts statistical or WASM-backed functions in browsers. In Node.js/Deno/Bun environments, this is a no-op as they load WASM synchronously on demand.",
    imports: [
      'import { setupTidyTS, createDataFrame, stats as s } from "@tidy-ts/dataframe";',
    ],
    parameters: [
      "url?: string | URL - Optional URL or path to the tidy_ts_dataframe.wasm file. If omitted, automatically resolves the URL relative to the package location. Useful for custom CDN paths or local hosting scenarios.",
    ],
    returns:
      "Promise<void> - Resolves when the WASM module is compiled and ready",
    examples: [
      '// BROWSER SETUP - Call once before using stats functions\nimport { setupTidyTS, createDataFrame, stats as s } from "@tidy-ts/dataframe";\n\n// Initialize WASM (required in browsers, no-op elsewhere)\nawait setupTidyTS();\n\n// Now you can use all tidy-ts features\nconst df = createDataFrame([{ x: 1 }, { x: 2 }, { x: 3 }]);\nconst meanValue = s.mean(df.x);',
      '// HTML EXAMPLE - Complete browser setup\n<!DOCTYPE html>\n<html>\n<head>\n  <script type="importmap">\n    { "imports": { "@tidy-ts/dataframe": "https://esm.sh/@tidy-ts/dataframe" } }\n  </script>\n</head>\n<body>\n  <script type="module">\n    import { setupTidyTS, createDataFrame, stats as s } from "@tidy-ts/dataframe";\n\n    async function main() {\n      // Required: Initialize WASM before using stats\n      await setupTidyTS();\n\n      const df = createDataFrame([\n        { name: "Alice", score: 85 },\n        { name: "Bob", score: 92 },\n        { name: "Charlie", score: 78 },\n      ]);\n\n      console.log("Mean score:", s.mean(df.score));\n      df.print();\n    }\n    main();\n  </script>\n</body>\n</html>',
      '// REACT/VITE EXAMPLE - Setup in app initialization\nimport { useEffect, useState } from "react";\nimport { setupTidyTS, createDataFrame, stats as s } from "@tidy-ts/dataframe";\n\nfunction App() {\n  const [ready, setReady] = useState(false);\n\n  useEffect(() => {\n    setupTidyTS().then(() => setReady(true));\n  }, []);\n\n  if (!ready) return <div>Loading...</div>;\n\n  // Now safe to use tidy-ts stats functions\n  const df = createDataFrame([{ value: 10 }, { value: 20 }]);\n  return <div>Mean: {s.mean(df.value)}</div>;\n}',
      '// Custom WASM URL (CDN or local hosting)\nawait setupTidyTS("https://cdn.example.com/tidy_ts_dataframe.wasm");\n\n// Local path\nawait setupTidyTS("/static/wasm/tidy_ts_dataframe.wasm");',
      '// ERROR HANDLING\ntry {\n  await setupTidyTS();\n} catch (error) {\n  console.error("Failed to load WASM:", error);\n  // Fallback: some operations work without WASM\n}',
    ],
    related: ["createDataFrame", "s.mean", "s.stdev"],
    bestPractices: [
      "✓ GOOD: Call setupTidyTS() once at app initialization before using stats functions",
      "✓ GOOD: The function is idempotent - calling it multiple times is safe (subsequent calls are no-ops)",
      "✓ GOOD: Use try/catch for graceful error handling if WASM fails to load",
      "✓ GOOD: In Node.js/Deno/Bun, setupTidyTS() is a no-op - safe to include unconditionally",
      "✓ GOOD: For custom deployments, pass the WASM URL as a parameter",
    ],
    antiPatterns: [
      "❌ BAD: Using s.mean(), s.stdev(), or other WASM-backed stats functions before calling setupTidyTS() in browsers - will throw an error",
      "❌ BAD: Calling setupTidyTS() in a loop or on every component render - call once at app initialization",
    ],
  },

  architecture: {
    name: "DataFrame Architecture",
    category: "dataframe",
    signature: "Columnar Storage + BitSet Masks + Copy-on-Write + WASM",
    description:
      "Tidy-TS DataFrames use a columnar storage architecture for high performance. Data is stored column-by-column (not row-by-row), enabling vectorized operations and better cache locality. Filtering uses lazy BitSet masks instead of copying data, and transformations use copy-on-write semantics. Performance-critical operations like joins, sorting, and statistical tests are compiled to WebAssembly (Rust).",
    imports: [
      'import { createDataFrame, stats as s } from "@tidy-ts/dataframe";',
    ],
    returns: "High-performance DataFrame operations",
    examples: [
      "// COLUMNAR STORAGE\n// Data is stored by column, not by row\n// This enables vectorized operations and better cache locality\nconst df = createDataFrame([\n  { x: 1, y: 10 },\n  { x: 2, y: 20 },\n  { x: 3, y: 30 },\n]);\n\n// Internally stored as:\n// columns: { x: [1, 2, 3], y: [10, 20, 30] }\n// Not as: [{ x: 1, y: 10 }, { x: 2, y: 20 }, { x: 3, y: 30 }]\n\n// Column access is O(1) - direct array access\nconst xValues = df.x;  // Returns the x column array directly",
      '// LAZY BITSET FILTERING\n// filter() does NOT copy data - it creates a BitSet mask\nconst df = createDataFrame([\n  { id: 1, status: "active" },\n  { id: 2, status: "inactive" },\n  { id: 3, status: "active" },\n]);\n\n// This is O(n) to evaluate, but does NOT copy the data\nconst active = df.filter(r => r.status === "active");\n\n// Chained filters combine masks with bitwise AND\n// Still no data copying - just mask operations\nconst result = df\n  .filter(r => r.status === "active")\n  .filter(r => r.id > 1);\n\n// Data is only materialized when you access it\nresult.print();  // Now the mask is applied',
      '// COPY-ON-WRITE SEMANTICS\n// Modifications create new columns only for changed data\nconst df = createDataFrame([{ x: 1 }, { x: 2 }, { x: 3 }]);\n\n// mutate() creates a new column, but x column is shared (not copied)\nconst df2 = df.mutate({ y: r => r.x * 2 });\n\n// Original df is unchanged (immutable)\nconsole.log(df.columns());   // ["x"]\nconsole.log(df2.columns());  // ["x", "y"]\n\n// Memory efficient: x array is shared between df and df2',
      '// WASM-POWERED OPERATIONS\n// Performance-critical operations run in WebAssembly (Rust)\n// - Joins: innerJoin, leftJoin, rightJoin, outerJoin\n// - Sorting: arrange() with complex multi-column sorts\n// - Statistics: mean, stdev, variance, correlation, t-tests\n// - Regression: GLM, linear models\n// - Distributions: normal, t, chi-square, etc.\n\n// Example: WASM-powered join (4-8x faster than pure JS)\nconst orders = createDataFrame([...]);\nconst customers = createDataFrame([...]);\nconst result = orders.leftJoin(customers, "customer_id");',
      '// PERFORMANCE TIPS\n\n// 1. Column access is fast - prefer df.columnName over toArray()\nconst values = df.x;  // Fast: direct column access\n// vs\nconst slow = df.toArray().map(r => r.x);  // Slow: row reconstruction\n\n// 2. Chained filters are efficient - they combine masks\ndf.filter(r => r.a > 0).filter(r => r.b < 10);  // Two masks combined\n\n// 3. Use WASM-powered functions for large datasets\ns.mean(df.x);      // WASM: fast for large arrays\ndf.leftJoin(...);  // WASM: optimized hash join\ndf.arrange("x");   // WASM: optimized sort\n\n// 4. extract() for stats functions that need arrays\nconst result = s.test.t.oneSample({\n  x: df.extract("measurement"),\n  mu: 100\n});',
    ],
    related: ["createDataFrame", "filter", "mutate", "leftJoin", "arrange"],
    bestPractices: [
      "✓ COLUMNAR STORAGE: Data stored by column for cache-efficient vectorized operations",
      "✓ LAZY FILTERING: filter() creates BitSet masks instead of copying data - multiple filters combine with bitwise AND",
      "✓ COPY-ON-WRITE: Transformations share unchanged columns between DataFrames for memory efficiency",
      "✓ WASM ACCELERATION: Joins, sorting, and stats run in WebAssembly (Rust) for 4-8x speedup on large datasets",
      "✓ PREFER COLUMN ACCESS: Use df.columnName instead of df.toArray() for better performance",
      "✓ USE extract(): Use df.extract('column') to get arrays for statistical functions",
    ],
  },
};
