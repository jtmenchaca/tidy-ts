# I/O Operations

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [readCSV](#readcsv)
- [readCSVMetadata](#readcsvmetadata)
- [writeCSV](#writecsv)
- [readXLSX](#readxlsx)
- [readXLSXMetadata](#readxlsxmetadata)
- [writeXLSX](#writexlsx)
- [readJSON](#readjson)
- [writeJSON](#writejson)
- [readParquet](#readparquet)
- [writeParquet](#writeparquet)
- [readArrow](#readarrow)

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

## readXLSX

Read XLSX file with optional schema validation and sheet selection. Returns a DataFrame that you can use with all DataFrame operations (filter, mutate, groupBy, etc.). Use readXLSXMetadata() first to inspect sheet names and preview data structure. When `no_types: true`, returns DataFrame<any> without strict type checking and preserves original types from XLSX (numbers, booleans). Supports file paths (Node.js/Deno) or ArrayBuffer/File/Blob (all environments including browsers).

### Signature

```typescript
readXLSX<T>(pathOrBuffer: string | ArrayBuffer | File | Blob, schema?: ZodSchema<T>, opts?: ReadXLSXOpts): Promise<DataFrame<T>>
readXLSX(pathOrBuffer: string | ArrayBuffer | File | Blob, opts: { no_types: true }): Promise<DataFrame<any>>
readXLSX<T>(pathOrBuffer: string | ArrayBuffer | File | Blob, schema: ZodSchema<T>, opts: { no_types: true }): Promise<DataFrame<any>>
```

### Import

```typescript
import { readCSV, writeCSV, readXLSX, writeXLSX, readXLSXMetadata } from "@tidy-ts/dataframe";
import { z } from "zod";
```

### Parameters

- pathOrBuffer: File path (Node.js/Deno) or ArrayBuffer/File/Blob (all environments including browsers)
- schema: Optional Zod schema for type validation and conversion (required unless no_types is true)
- opts.sheet: Sheet name or index (default: first sheet)
- opts.skip: Number of rows to skip (useful if first row is a title, not headers)
- opts.no_types: When true, returns DataFrame<any> instead of typed DataFrame. Schema is optional when true. Preserves original XLSX types (numbers, booleans).

### Returns

Promise<DataFrame<T>> or Promise<DataFrame<any>> - A DataFrame object with all standard operations

### Examples

```typescript
// With Zod schema validation (file path)
import { z } from "zod";

const schema = z.object({
  id: z.number(),
  name: z.string(),
  age: z.number(),
  email: z.string().email(),
  createdAt: z.date(), // Excel dates auto-converted
});

const df = await readXLSX("data.xlsx", schema)
// Without schema - returns DataFrame<any>
const df = await readXLSX("data.xlsx", { no_types: true })
// Types are inferred from XLSX (numbers, booleans preserved)
// With schema but no_types - validation occurs but returns DataFrame<any>
const df = await readXLSX("data.xlsx", schema, { no_types: true })
// Browser-compatible: Read from File object
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];
const df = await readXLSX(file, schema, { no_types: true })
// Browser-compatible: Read from ArrayBuffer
const arrayBuffer = await file.arrayBuffer();
const df = await readXLSX(arrayBuffer, { no_types: true })
// With nullable fields and specific sheet
import { z } from "zod";

const schema = z.object({
  species: z.string(),
  bill_length_mm: z.number().nullable(),
  bill_depth_mm: z.number().nullable(),
  body_mass_g: z.number(),
});

const df = await readXLSX("data.xlsx", schema, { sheet: "Summary" })
// Skip header rows (e.g., if row 0 is a title)
import { z } from "zod";

const schema = z.object({
  name: z.string(),
  value: z.number(),
});

const df = await readXLSX("data.xlsx", schema, { skip: 1 })
// Chain with DataFrame operations
import { z } from "zod";
import { stats as s } from "@tidy-ts/dataframe";

const schema = z.object({
  region: z.string(),
  amount: z.number(),
});

const result = await readXLSX("sales.xlsx", schema)
  .filter(r => r.amount > 100)
  .groupBy("region")
  .summarize({ total: g => s.sum(g.amount) })
```

### Best Practices

- ✓ GOOD: Use readXLSXMetadata() first to inspect sheets and preview structure
- ✓ GOOD: Use skip option if first row is a title/note rather than column headers
- ✓ GOOD: Provide a Zod schema for type safety and automatic type conversion
- ✓ GOOD: Use no_types: true when schema is unknown or dynamic
- ✓ GOOD: Chain DataFrame operations immediately after reading

### Anti-patterns

- ❌ BAD: Using no_types when you know the schema - you lose type safety

### Related

`writeXLSX`, `readCSV`, `readXLSXMetadata`

---

## readXLSXMetadata

Read metadata about an XLSX file without full parsing. Shows available sheets, default sheet, and a preview of the first few rows. Use this before readXLSX() to understand the file structure and determine which sheet to read and whether to skip rows. Supports file paths (Node.js/Deno) or ArrayBuffer/File/Blob (all environments including browsers).

### Signature

```typescript
readXLSXMetadata(pathOrBuffer: string | ArrayBuffer | File | Blob, { previewRows?: number, sheet?: string | number }): Promise<XLSXMetadata>
```

### Import

```typescript
import { readXLSXMetadata, readXLSX } from "@tidy-ts/dataframe";
```

### Parameters

- pathOrBuffer: File path (Node.js/Deno) or ArrayBuffer/File/Blob (all environments including browsers)
- previewRows: Number of rows to preview (default: 5)
- sheet: Which sheet to preview - name or index (default: first sheet)

### Returns

Promise<{ sheets: SheetInfo[], defaultSheet: string, sheetName: string, headers: string[], totalRows: number, firstRows: string[][] }>

### Examples

```typescript
// Inspect file structure (file path)
const meta = await readXLSXMetadata("data.xlsx")
console.log("Sheets:", meta.sheets)
console.log("Headers:", meta.headers)
console.log("Preview:", meta.firstRows)
// Browser-compatible: Inspect from File object
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];
const meta = await readXLSXMetadata(file)
console.log("Sheets:", meta.sheets)
// Check if first row needs to be skipped
const meta = await readXLSXMetadata("data.xlsx")
if (meta.firstRows[0][0] === "Report Title") {
  df = await readXLSX("data.xlsx", schema, { skip: 1 })
}
// Preview a specific sheet
const meta = await readXLSXMetadata("data.xlsx", { sheet: "Summary", previewRows: 10 })
```

### Best Practices

- ✓ GOOD: Use before readXLSX to understand file structure
- ✓ GOOD: Check preview to determine if skip option is needed
- ✓ GOOD: Verify sheet names before reading specific sheets

### Related

`readXLSX`

---

## writeXLSX

Write DataFrame to XLSX file.

### Signature

```typescript
writeXLSX<T>(df: DataFrame<T>, path: string, opts?: { sheet?: string }): Promise<void>
```

### Import

```typescript
import { readCSV, writeCSV, readXLSX, writeXLSX } from "@tidy-ts/dataframe";
```

### Parameters

- df: DataFrame to write
- path: Output file path
- opts.sheet: Sheet name (default: "Sheet1")

### Returns

Promise<void>

### Examples

```typescript
await writeXLSX(df, "output.xlsx")
await writeXLSX(df, "output.xlsx", { sheet: "Summary" })
```

### Related

`readXLSX`, `writeCSV`

---

## readJSON

Read JSON file with Zod schema validation. Returns a DataFrame for array of objects, or validated data for other schemas. Automatically infers types from schema.

### Signature

```typescript
readJSON<T>(filePath: string, schema: ZodSchema<T>): Promise<DataFrame<T> | T>
```

### Import

```typescript
import { readJSON } from "@tidy-ts/dataframe";
```

### Parameters

- filePath: Path to JSON file (Node.js/Deno only)
- schema: Zod schema for validation and type inference

### Returns

Promise<DataFrame<T>> for array of objects, or Promise<T> for other types

### Examples

```typescript
// Read array of objects as DataFrame
const UserSchema = z.array(z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
}));
const users = await readJSON("users.json", UserSchema)
// Read configuration object
const ConfigSchema = z.object({
  apiUrl: z.string().url(),
  timeout: z.number().positive(),
});
const config = await readJSON("config.json", ConfigSchema)
```

### Best Practices

- ✓ GOOD: Use z.array(z.object({...})) to get a DataFrame
- ✓ GOOD: Zod schema provides automatic type validation and conversion

### Related

`writeJSON`, `readCSV`

---

## writeJSON

Write DataFrame to JSON file. Serializes each row as an object in a JSON array. Handles nested DataFrames by converting them to arrays.

### Signature

```typescript
writeJSON<T>(filePath: string, dataFrame: DataFrame<T>, opts?: WriteJSONOpts): Promise<void>
```

### Import

```typescript
import { writeJSON } from "@tidy-ts/dataframe";
```

### Parameters

- filePath: Path where JSON file should be written
- dataFrame: DataFrame to export
- opts.naValue: Custom NA representation (optional)
- opts.formatDate: Custom date formatting function (optional)

### Returns

Promise<void>

### Examples

```typescript
// Basic export
const df = createDataFrame([
  { name: "Alice", age: 25 },
  { name: "Bob", age: 30 }
]);
await writeJSON("users.json", df)
// With custom date formatting
await writeJSON("data.json", df, {
  formatDate: (date) => date.toISOString().split("T")[0]
})
```

### Related

`readJSON`, `writeCSV`

---

## readParquet

Read Parquet file or buffer with Zod schema validation. Supports file paths (Node.js/Deno) or ArrayBuffer (all environments). Efficient columnar format for large datasets.

### Signature

```typescript
readParquet<T>(pathOrBuffer: string | ArrayBuffer, schema: ZodSchema<T>, opts?: ParquetOptions): Promise<DataFrame<T>>
```

### Import

```typescript
import { readParquet } from "@tidy-ts/dataframe";
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
import { writeParquet } from "@tidy-ts/dataframe/ts/io";
```

### Parameters

- df: DataFrame to write
- path: Output file path

### Returns

DataFrame<T> - Original DataFrame for chaining

### Examples

```typescript
// Write to Parquet file
import { writeParquet } from "@tidy-ts/dataframe/ts/io";

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

## readArrow

Read Apache Arrow file or buffer with Zod schema validation. Supports file paths (Node.js/Deno) or ArrayBuffer (all environments). Efficient for inter-process data exchange.

### Signature

```typescript
readArrow<T>(pathOrBuffer: string | ArrayBuffer, schema: ZodSchema<T>, opts?: ArrowOptions): Promise<DataFrame<T>>
```

### Import

```typescript
import { readArrow } from "@tidy-ts/dataframe";
```

### Parameters

- pathOrBuffer: File path (Node.js/Deno) or ArrayBuffer
- schema: Zod schema for validation and type conversion
- opts.columns: Select specific columns (optional)
- opts.useDate: Convert timestamps to Date objects (optional)
- opts.useBigInt: Use BigInt for large integers (optional)

### Returns

Promise<DataFrame<T>>

### Examples

```typescript
// Read from file
const schema = z.object({
  id: z.number(),
  name: z.string(),
  created: z.date(),
});
const df = await readArrow("data.arrow", schema)
// Read from ArrayBuffer
const buffer = await Deno.readFile("data.arrow");
const df = await readArrow(buffer, schema, {
  columns: ["id", "name"],
  useDate: true
})
```

### Best Practices

- ✓ GOOD: Use Arrow for efficient inter-process data exchange
- ✓ GOOD: Set useDate: true to convert timestamps to Date objects

### Related

`readParquet`, `readCSV`

---
