# Xlsx

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [readXLSX](#readxlsx)
- [peekXLSX](#peekxlsx)
- [readXLSXMetadata](#readxlsxmetadata)
- [writeXLSX](#writexlsx)

---

## readXLSX

Read XLSX file with Zod schema validation and sheet selection. Returns a DataFrame that you can use with all DataFrame operations (filter, mutate, groupBy, etc.). If you don't know the schema, use peekXLSX() first to inspect sheet names, preview data structure, and generate an appropriate schema. Supports file paths (Node.js/Deno) or ArrayBuffer/File/Blob (all environments including browsers).

### Signature

```typescript
readXLSX<T>(pathOrBuffer: string | ArrayBuffer | File | Blob, schema: ZodSchema<T>, opts?: ReadXLSXOpts): Promise<DataFrame<T>>
```

### Import

```typescript
import { readXLSX, peekXLSX } from "@tidy-ts/dataframe";
import { z } from "zod";
```

### Parameters

- pathOrBuffer: File path (Node.js/Deno) or ArrayBuffer/File/Blob (all environments including browsers)
- schema: Zod schema for type validation and conversion
- opts.sheet: Sheet name or index (default: first sheet)
- opts.skip: Number of rows to skip (useful if first row is a title, not headers)

### Returns

Promise<DataFrame<T>> - A typed DataFrame object with all standard operations

### Examples

```typescript
// RECOMMENDED: Use peekXLSX first to understand file structure
const info = await peekXLSX("data.xlsx");
console.log(info); // Shows sheets, headers, preview, and example schema
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
// Browser-compatible: Read from File object
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];
const df = await readXLSX(file, schema)
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

- ✓ GOOD: Use peekXLSX() first to inspect sheets, headers, and generate a schema
- ✓ GOOD: Always provide a Zod schema for type safety and automatic type conversion
- ✓ GOOD: Use skip option if first row is a title/note rather than column headers
- ✓ GOOD: Chain DataFrame operations immediately after reading
- ✓ GOOD: Use .nullable() for columns that may have missing values

### Anti-patterns

- ❌ BAD: Using no_types: true - you lose all type safety and autocomplete. Use peekXLSX() to understand the schema first.
- ❌ BAD: Guessing column types - use peekXLSX() to see actual data before defining schema

### Related

`peekXLSX`, `writeXLSX`, `readCSV`, `readXLSXMetadata`

---

## peekXLSX

Inspect an XLSX file and return a markdown-formatted description of its structure. Shows available sheets, column headers, data preview, and a suggested Zod schema. This is the recommended way to understand an XLSX file before reading it with readXLSX().

### Signature

```typescript
peekXLSX(path: string, options?: { previewRows?: number, sheet?: string | number }): Promise<string>
```

### Import

```typescript
import { peekXLSX, readXLSX } from "@tidy-ts/dataframe";
```

### Parameters

- path: File path to XLSX file
- options.previewRows: Number of rows to preview (default: 5)
- options.sheet: Which sheet to preview - name or index (default: first sheet)

### Returns

Promise<string> - Markdown-formatted description of file structure

### Examples

```typescript
// Inspect file structure (returns markdown)
const info = await peekXLSX("data.xlsx");
console.log(info);
// Output includes:
// - Available sheets
// - Column headers
// - Data preview
// - Example Zod schema
// Preview a specific sheet
const info = await peekXLSX("data.xlsx", { sheet: "Summary" })
// Preview by sheet index (0-based)
const info = await peekXLSX("data.xlsx", { sheet: 1 })
// Get more preview rows
const info = await peekXLSX("data.xlsx", { previewRows: 10 })
```

### Best Practices

- ✓ GOOD: Use peekXLSX() first to understand file structure before reading
- ✓ GOOD: Copy the suggested schema from the output and customize types
- ✓ GOOD: Use the preview to identify nullable columns and data patterns
- ✓ GOOD: Check if first row looks like a title (needs skip: 1)

### Related

`readXLSX`, `readXLSXMetadata`, `peekCSV`, `peek`

---

## readXLSXMetadata

Read metadata about an XLSX file without full parsing. Returns a structured object with sheets, headers, and preview rows. For a more user-friendly output, consider using peekXLSX() which returns formatted markdown with a suggested schema.

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
```

### Best Practices

- ✓ GOOD: Use peekXLSX() for human/AI-readable output with suggested schema
- ✓ GOOD: Use readXLSXMetadata() when you need programmatic access to metadata

### Related

`peekXLSX`, `readXLSX`

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
