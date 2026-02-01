# Parquet

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [readParquet](#readparquet)
- [writeParquet](#writeparquet)

---

## readParquet

Read Parquet file or buffer with Zod schema validation. Supports file paths (Node.js/Deno) or ArrayBuffer (all environments). Efficient columnar format for large datasets.

### Signature

```typescript
readParquet<T>(pathOrBuffer: string | ArrayBuffer, schema: ZodSchema<T>, opts?: ParquetOptions): Promise<DataFrame<T>>
```

### Import

```typescript
import { readParquet } from "@tidy-ts/parquet";
```

### Parameters

- pathOrBuffer: File path (Node.js/Deno) or ArrayBuffer
- schema: Zod schema for validation and type conversion
- opts.columns: Select specific columns (optional)
- opts.rowStart: Start row index (optional)
- opts.rowEnd: End row index (optional)

### Returns

Promise<DataFrame<T>>

### Examples

```typescript
// Read from file
const schema = z.object({
  id: z.number(),
  name: z.string(),
});
const df = await readParquet("data.parquet", schema)
// Read specific columns and row range
const df = await readParquet("data.parquet", schema, {
  columns: ["id", "name"],
  rowStart: 0,
  rowEnd: 1000
})
```

### Best Practices

- ✓ GOOD: Use Parquet for large datasets - efficient columnar storage
- ✓ GOOD: Specify columns option to read only needed data

### Related

`writeParquet`, `readArrow`, `readCSV`

---

## writeParquet

Write DataFrame to Parquet file. Automatically infers column types. Requires static import. Efficient columnar format for large datasets.

### Signature

```typescript
writeParquet<T>(df: DataFrame<T>, path: string): DataFrame<T>
```

### Import

```typescript
import { writeParquet } from "@tidy-ts/parquet";
```

### Parameters

- df: DataFrame to write
- path: Output file path

### Returns

DataFrame<T> - Original DataFrame for chaining

### Examples

```typescript
// Write to Parquet file
import { writeParquet } from "@tidy-ts/parquet";

const df = createDataFrame([
  { id: 1, name: "Alice", age: 30 },
  { id: 2, name: "Bob", age: 25 }
]);
writeParquet(df, "output.parquet")
```

### Best Practices

- ⚠ NOTE: Requires static import, not available via dynamic import
- ✓ GOOD: Use Parquet for large datasets - efficient columnar storage

### Related

`readParquet`, `writeCSV`

---
