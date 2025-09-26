# tidy-ts: Type-Safe DataFrames for TypeScript

**tidy-ts** (`@tidy-ts/dataframe`) is a composable, type-safe DataFrame library for TypeScript and Deno that brings the power and expressiveness of "tidy" data pipelines—familiar from R's tidyverse and Python's pandas—into the TypeScript ecosystem. It's designed for both synchronous and asynchronous workflows, with first-class support for schema validation, lazy evaluation, and seamless interoperability with existing JavaScript/TypeScript arrays and streams.

---

## 🔍 Core Principles

| Principle | Description |
|-----------|-------------|
| **Type-Safe by Design** | Leverages TypeScript's advanced type inference and optional Zod schemas to ensure every column's type is known and enforced at compile time. No casting needed in your pipeline. |
| **Fluent, Lazy API** | Chainable verbs (mutate, filter, select, groupBy, summarize, arrange, etc.) return lightweight proxies. Computation is deferred until you await the final DataFrame or call a sink method like `.toArray()`, `.print()`, or `.collect()`. |
| **Sync & Async Harmony** | Supports both synchronous row-wise functions and asynchronous callbacks within the same pipeline. Async tasks (e.g. API calls, DB lookups) are automatically resolved under the hood; you simply await at the end. |
| **Columnar Under the Hood** | Data is stored in a column-oriented layout for performance and vectorized operations. Underlying bit-mask and index buffers enable zero-copy filtering, sorting, and grouping until materialization. |
| **Schema Validation** | Integrates with Zod to provide optional—but recommended—runtime schema checks when ingesting untyped sources (CSV, JSON, external APIs), catching malformed or missing data early. |
| **Composable Verbs** | Core verbs mirror the tidyverse vocabulary, with consistent behavior across arrays and DataFrames. Many statistical helpers (`stats.mean`, `stats.cumsum`, `stats.corr`, etc.) operate directly on arrays or DataFrame columns. |
| **Extensible & Modular** | Underpinned by a registry of "verbs" and a flexible proxy-based runtime. You can add custom verbs or integrations (e.g. streaming, abort signals) without touching the core. |

---

## 📦 Key Features

### 1. DataFrame Creation

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";
const df = createDataFrame([{ a: 1, b: "x" }, { a: 2, b: "y" }]);
```

- Infers schema from literal data
- Optionally pass a Zod schema for strict validation
- Also supports `readCSV`, `readJSON` with schema enforcement

### 2. Chainable Verbs

```typescript
const result = await df
  .mutate({ c: (r) => r.a * 2 })
  .filter((r) => r.c > 2)
  .groupBy("b")
  .summarize({ sum_c: (g) => stats.sum(g.c) })
  .arrange("sum_c", "desc");
```

- Each verb returns a proxy—no work happens until you await
- `.print()`, `.toArray()`, `.toObject()`, `.collect()` materialize and output

### 3. Async Transformations

```typescript
const enriched = await df
  .mutate({
    remoteInfo: async (r) => fetchInfo(r.id),  // API call per row
  })
  .filter(async (r) => await check(r.remoteInfo));
```

- Mixed sync + async in the same pipeline
- Automatic promise resolution and type preservation

### 4. Grouping & Aggregation

```typescript
const summary = df
  .groupBy("category")
  .summarize({
    count: (g) => g.nrows(),
    avg: (g) => stats.mean(g.value),
  });
```

- Supports multi-key grouping, async aggregators, and chaining further verbs
- Type of output columns inferred precisely

### 5. Schema-Aware I/O

```typescript
import { readCSV } from "@tidy-ts/dataframe";
const users = await readCSV(csvString, UserSchema, { naValues: [""] });
```

- Zod schemas catch bad data at ingestion
- Configurable `naValues`, custom parsing

### 6. Rich Statistics Module

```typescript
import { stats as s } from "@tidy-ts/dataframe";
const values = df.value;                // typed array
const mean = s.mean(values);            // number
const q = s.quantile(values, 0.25);     // number | number[] for arrays
```

- 25+ functions: mean, median, quantile, rank, corr, covariance, cumsum, lag/lead, and more
- Works on plain arrays or DataFrame columns

### 7. Column Manipulation & Reshaping

- `select`, `drop`, `rename`, `pivotWider`, `pivotLonger`, `transpose`
- All preserve precise types, even for optional or mixed-type columns

### 8. Missing Data Strategies

```typescript
const cleaned = df.replaceNA({ x: 0, y: "Unknown" });
```

- Detects null, undefined, NaN by default
- Flexible replacement, conditional imputation, row-filtering

### 9. Join Operations

```typescript
const joined = dfA.innerJoin(dfB, ["key1", "key2"]);
```

- Inner, left, right, outer, cross joins with multi-key support
- Strong typing: non-matching columns become `T | undefined`, never silently dropped

### 10. Performance & Streaming

- Columnar buffers + bit-mask filtering enable near-native speeds
- Planned support for streaming large datasets via abort-aware iterators and back-pressure

---

## 🎯 Who It's For

- **TypeScript/JavaScript Teams** building data-intensive web apps, dashboards, or microservices
- **Bioinformatics & Clinical Research**, where data correctness and reproducibility are paramount
- **Full-stack Developers** needing a unified, typed approach to data wrangling both client- and server-side
- **Data Engineers** looking for an alternative to Python/R stacks, fully integrated into modern web toolchains

---

## 🚀 Why tidy-ts?

- **Safety & Discoverability**: Your IDE knows exactly which columns exist, their types, and available verbs—no runtime surprises.
- **Expressiveness**: Pipelines read like plain English, minimizing boilerplate and cognitive load.
- **Interoperability**: Works seamlessly with existing arrays, streams, and any JavaScript data source.
- **Future-Proof**: Built for async, streaming, and big data. Schema and proxy-based design allow evolving to DAGs, abort signals, and beyond.

---

In short, **tidy-ts** brings the best practices of modern data science into the TypeScript world—combining the reliability of static types, the flexibility of async workflows, and the elegance of a fluent, lazy API. It's the bridge between typed application code and powerful data analytics, all within one coherent ecosystem.