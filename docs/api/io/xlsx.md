# Xlsx

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [readXLSX](#readxlsx)
- [readXLSXMetadata](#readxlsxmetadata)
- [writeXLSX](#writexlsx)

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
