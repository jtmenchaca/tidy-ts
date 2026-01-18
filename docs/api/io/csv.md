# Csv

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [readCSV](#readcsv)
- [peekCSV](#peekcsv)
- [readCSVMetadata](#readcsvmetadata)
- [writeCSV](#writecsv)

---

## readCSV

Read CSV file or parse CSV content with Zod schema validation. Returns a DataFrame that you can use with all DataFrame operations. If you don't know the schema, use peekCSV() first to inspect the file structure and generate an appropriate schema.

### Signature

```typescript
readCSV<T>(pathOrContent: string, schema: ZodSchema<T>, opts?: CsvOptions): Promise<DataFrame<T>>
```

### Import

```typescript
import { readCSV, peekCSV } from "@tidy-ts/dataframe";
import { z } from "zod";
```

### Parameters

- pathOrContent: File path to CSV or raw CSV content string
- schema: Zod schema for validation and type conversion
- opts.comma: Field delimiter/comma character (default: ',')
- opts.skipEmptyLines: Skip empty lines (default: true)

### Returns

Promise<DataFrame<T>> - A typed DataFrame object with all standard operations

### Examples

```typescript
// RECOMMENDED: Use peekCSV first to understand file structure
const info = await peekCSV("data.csv");
console.log(info); // Shows headers, preview, and example schema
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

- ✓ GOOD: Use peekCSV() first to inspect file structure and generate a schema
- ✓ GOOD: Always provide a Zod schema for type safety and automatic type conversion
- ✓ GOOD: Works with both file paths and raw CSV strings
- ✓ GOOD: Use .nullable() for columns that may have missing values

### Anti-patterns

- ❌ BAD: Using no_types: true - you lose all type safety and autocomplete. Use peekCSV() to understand the schema first.
- ❌ BAD: Reading large files without schema - use streaming readCSVStream instead
- ❌ BAD: Guessing column types - use peekCSV() to see actual data before defining schema

### Related

`peekCSV`, `writeCSV`, `readCSVMetadata`, `readXLSX`

---

## peekCSV

Inspect a CSV file and return a markdown-formatted description of its structure. Shows column headers, data preview, and a suggested Zod schema. This is the recommended way to understand a CSV file before reading it with readCSV().

### Signature

```typescript
peekCSV(path: string, options?: { previewRows?: number, comma?: string }): Promise<string>
```

### Import

```typescript
import { peekCSV, readCSV } from "@tidy-ts/dataframe";
```

### Parameters

- path: File path to CSV file
- options.previewRows: Number of rows to preview (default: 5)
- options.comma: Field delimiter/comma character (default: ",")

### Returns

Promise<string> - Markdown-formatted description of file structure

### Examples

```typescript
// Inspect file structure (returns markdown)
const info = await peekCSV("data.csv");
console.log(info);
// Output includes:
// - Column headers
// - Data preview
// - Example Zod schema
// Preview TSV file
const info = await peekCSV("data.tsv", { comma: "\t" })
// Get more preview rows
const info = await peekCSV("data.csv", { previewRows: 10 })
```

### Best Practices

- ✓ GOOD: Use peekCSV() first to understand file structure before reading
- ✓ GOOD: Copy the suggested schema from the output and customize types
- ✓ GOOD: Use the preview to identify nullable columns and data patterns

### Related

`readCSV`, `readCSVMetadata`, `peekXLSX`, `peek`

---

## readCSVMetadata

Read metadata about a CSV file without full parsing. Returns a structured object with headers and preview rows. For a more user-friendly output, consider using peekCSV() which returns formatted markdown.

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
```

### Best Practices

- ✓ GOOD: Use peekCSV() for human/AI-readable output with suggested schema
- ✓ GOOD: Use readCSVMetadata() when you need programmatic access to metadata

### Related

`peekCSV`, `readCSV`

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
