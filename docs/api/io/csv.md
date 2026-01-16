# Csv

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [readCSV](#readcsv)
- [readCSVMetadata](#readcsvmetadata)
- [writeCSV](#writecsv)

---

## readCSV

Read CSV file or parse CSV content with optional Zod schema validation. Returns a DataFrame that you can use with all DataFrame operations. Use readCSVMetadata() first to inspect headers and preview data structure. When `no_types: true`, returns DataFrame<any> without strict type checking, useful for dynamic or unknown schemas.

### Signature

```typescript
readCSV<T>(pathOrContent: string, schema?: ZodSchema<T>, opts?: CsvOptions): Promise<DataFrame<T>>
readCSV(pathOrContent: string, opts: { no_types: true }): Promise<DataFrame<any>>
readCSV<T>(pathOrContent: string, schema: ZodSchema<T>, opts: { no_types: true }): Promise<DataFrame<any>>
```

### Import

```typescript
import { readCSV, writeCSV, readCSVMetadata } from "@tidy-ts/dataframe";
import { z } from "zod";
```

### Parameters

- pathOrContent: File path to CSV or raw CSV content string
- schema: Optional Zod schema for validation and type conversion (required unless no_types is true)
- opts.comma: Field delimiter/comma character (default: ',')
- opts.skipEmptyLines: Skip empty lines (default: true)
- opts.no_types: When true, returns DataFrame<any> instead of typed DataFrame. Schema is optional when true.

### Returns

Promise<DataFrame<T>> or Promise<DataFrame<any>> - A DataFrame object with all standard operations

### Examples

```typescript
// Read from file with Zod schema
import { z } from "zod";

const schema = z.object({
  id: z.number(),
  name: z.string(),
  age: z.number(),
  email: z.string().email(),
});

const df = await readCSV("data.csv", schema)
// Parse from string with schema
import { z } from "zod";

const csv = "name,age\nAlice,30\nBob,25";
const schema = z.object({
  name: z.string(),
  age: z.number(),
});
const df = await readCSV(csv, schema)
// Without schema - returns DataFrame<any>
const df = await readCSV("data.csv", { no_types: true })
// All values remain as strings, but methods work
// With schema but no_types - validation occurs but returns DataFrame<any>
const df = await readCSV("data.csv", schema, { no_types: true })
// With nullable fields and custom delimiter
import { z } from "zod";

const schema = z.object({
  id: z.number(),
  name: z.string(),
  score: z.number().nullable(),
});
const df = await readCSV("data.tsv", schema, { comma: "\t", naValues: [""] })
// Chain with DataFrame operations
import { z } from "zod";
import { stats as s } from "@tidy-ts/dataframe";

const schema = z.object({
  region: z.string(),
  amount: z.number(),
});
const result = await readCSV("sales.csv", schema)
  .filter(r => r.amount > 100)
  .groupBy("region")
  .summarize({ total: g => s.sum(g.amount) })
```

### Best Practices

- ✓ GOOD: Use readCSVMetadata() first to inspect headers and structure
- ✓ GOOD: Provide a Zod schema for type safety and automatic type conversion
- ✓ GOOD: Use no_types: true when schema is unknown or dynamic
- ✓ GOOD: Works with both file paths and raw CSV strings

### Anti-patterns

- ❌ BAD: Using no_types when you know the schema - you lose type safety
- ❌ BAD: Reading large files without schema - use streaming readCSVStream instead

### Related

`writeCSV`, `readCSVMetadata`, `readXLSX`

---

## readCSVMetadata

Read metadata about a CSV file without full parsing. Shows column headers and a preview of the first few rows. Use this before readCSV() to understand the file structure and determine the appropriate schema.

### Signature

```typescript
readCSVMetadata(pathOrContent: string, { previewRows?: number, comma?: string }): Promise<CSVMetadata>
```

### Import

```typescript
import { readCSVMetadata, readCSV } from "@tidy-ts/dataframe";
```

### Parameters

- pathOrContent: File path to CSV or raw CSV content string
- previewRows: Number of rows to preview (default: 5)
- comma: Field delimiter/comma character (default: ",")

### Returns

Promise<{ headers: string[], totalRows: number, firstRows: string[][], delimiter: string }>

### Examples

```typescript
// Inspect file structure
const meta = await readCSVMetadata("data.csv")
console.log("Columns:", meta.headers)
console.log("Preview:", meta.firstRows)
// Build schema from headers
import { z } from "zod";

const meta = await readCSVMetadata("data.csv")
const schema = z.object({
  id: z.number(),
  name: z.string(),
  age: z.number(),
  email: z.string().email().optional(),
})
const df = await readCSV("data.csv", schema)
// Preview TSV file
const meta = await readCSVMetadata("data.tsv", { comma: "\t" })
```

### Best Practices

- ✓ GOOD: Use before readCSV to understand file structure
- ✓ GOOD: Check headers to determine appropriate Zod schema
- ✓ GOOD: Inspect preview to identify data types and missing values

### Related

`readCSV`

---

## writeCSV

Write DataFrame to CSV file.

### Signature

```typescript
writeCSV<T>(df: DataFrame<T>, path: string): Promise<void>
```

### Import

```typescript
import { readCSV, writeCSV, readXLSX, writeXLSX } from "@tidy-ts/dataframe";
```

### Parameters

- df: DataFrame to write
- path: Output file path

### Returns

Promise<void>

### Examples

```typescript
await writeCSV(df, "output.csv")
```

### Related

`readCSV`, `writeXLSX`, `writeParquet`

---
