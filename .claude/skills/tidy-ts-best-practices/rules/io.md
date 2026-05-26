---
name: io
description: I/O readers and writers — CSV, XLSX, JSON, Arrow, Parquet. Every reader takes a Zod schema; use peek* helpers to inspect structure before defining the schema.
metadata:
  tags: io, csv, xlsx, json, arrow, parquet, zod, schema
---

# Reading & writing data

All readers take a **Zod schema** as the second argument. The schema validates input and gives you typed columns in the resulting DataFrame.

**Schema keys must match CSV header names exactly.** A schema with fewer columns than the CSV is fine — only the schema's columns are loaded — but the keys themselves must match the headers. Rename to friendlier identifiers with a follow-up `.rename(...)` step if you want different names downstream.

**Date / time columns — prefer Temporal.** For new code use the temporal-zod validators from `@tidy-ts/shims`. They parse the matching ISO 8601 string into a proper `Temporal.*` object that the rest of tidy-ts (`asofJoin`, `downsample`, `arrange`, `sliceMin`/`Max`, time-bucket helpers) understands natively. Use the one that matches the precision the file actually has:

| CSV string         | Schema field             | Result type             |
|--------------------|--------------------------|-------------------------|
| `2024-03-04`       | `zPlainDate`             | `Temporal.PlainDate`    |
| `2024-03-04T09:30:00` | `zPlainDateTime`      | `Temporal.PlainDateTime`|
| `2024-03-04T09:30:00Z` (UTC instant) | `zInstant` | `Temporal.Instant`      |
| `2024-03-04T09:30:00-05:00[America/New_York]` | `zZonedDateTime` | `Temporal.ZonedDateTime` |
| `09:30:00`         | `zPlainTime`             | `Temporal.PlainTime`    |
| `2024-03`          | `zPlainYearMonth`        | `Temporal.PlainYearMonth`|
| `--03-04`          | `zPlainMonthDay`         | `Temporal.PlainMonthDay`|

```typescript
import { readCSV } from "@tidy-ts/dataframe";
import { zPlainDate, zPlainDateTime, zInstant } from "@tidy-ts/shims";
import { z } from "zod";

const schema = z.object({
  id: z.number(),
  day: zPlainDate,              // "2024-03-04" → Temporal.PlainDate
  visit: zPlainDateTime,        // "2024-03-04T09:30:00" → Temporal.PlainDateTime
  timestamp: zInstant,          // "2024-03-04T09:30:00Z" → Temporal.Instant
});
```

`z.date()` / `z.coerce.date()` still works and gives JS `Date` objects — prefer that only when you must hand the column to JS-`Date`-only consumers (legacy code, certain libraries). `Temporal` types compare and sort correctly under `arrange`, `groupBy`, and stat aggregators (`s.min` / `s.max` / `s.first` / `s.last`); JS `Date` works too, but Temporal carries timezone/precision semantics through the pipeline.

**Duplicate header names throw by default** (both CSV and XLSX). The error names every duplicate, lists its column indices, and shows the schema literal you'd write if you opt in. To read a file with repeated headers as-is, pass `allowDuplicateHeaders: true` — the second and later occurrences are renamed to `name_2`, `name_3`, etc., and your schema must address them by those names. Prefer renaming the source file when you control it.

For unknown / dynamic schemas: use the `peek*` helpers first to inspect headers and preview rows, then write the schema.

## CSV

```typescript
import { readCSV, peekCSV, writeCSV } from "@tidy-ts/dataframe";
import { z } from "zod";

// 1. Peek the file first (returns formatted markdown with a suggested schema)
const info = await peekCSV("data.csv");
console.log(info);

// 2. Define the schema and read
const schema = z.object({
  id: z.number(),
  name: z.string(),
  age: z.number(),
  email: z.string().email(),
});

const df = await readCSV("data.csv", schema);

// String content works too
const csv = "name,age\nAlice,30\nBob,25";
const df2 = await readCSV(csv, schema);

// TSV / custom delimiter, nullable columns, NA values
const df3 = await readCSV("data.tsv", schema, { comma: "\t", naValues: [""] });

// Missing-value handling: combine `.nullable()` OR `.optional()` on the field
// with `naValues`. Strings matching `naValues` are coerced before Zod
// validation, and the schema decides what they become:
//   `.nullable()` → `null`        (column type is `(T | null)[]`)
//   `.optional()` → `undefined`   (column type is `(T | undefined)[]`)
// Default naValues: ["", "NA", "NaN", "null", "undefined"]; override with
// `{ naValues: [...] }`.
const nullableSchema = z.object({
  id: z.number(),
  weight_kg: z.number().nullable(),   // empty / "NA" → null
});
const optionalSchema = z.object({
  id: z.number(),
  weight_kg: z.number().optional(),   // empty / "NA" → undefined
});
const df4 = await readCSV("data.csv", nullableSchema, { naValues: ["NA", ""] });
const df5 = await readCSV("data.csv", optionalSchema, { naValues: ["NA", ""] });

// Write
await writeCSV(df, "output.csv");
// In browsers, triggers a download with the given filename.
```

Programmatic metadata (when you need it in code rather than markdown):

```typescript
import { readCSVMetadata } from "@tidy-ts/dataframe";
const meta = await readCSVMetadata("data.csv");
// { headers, totalRows, firstRows, delimiter }
```

## XLSX

```typescript
import { readXLSX, peekXLSX, writeXLSX } from "@tidy-ts/dataframe";

await peekXLSX("data.xlsx");                                  // see sheets + suggested schema
await peekXLSX("data.xlsx", { sheet: "Summary", previewRows: 10 });

const df = await readXLSX("data.xlsx", schema);
const df2 = await readXLSX("data.xlsx", schema, { sheet: "Summary" });
const df3 = await readXLSX("data.xlsx", schema, { skip: 1 });  // first row is a title

// Browser: read from a File / Blob / ArrayBuffer
const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
const df4 = await readXLSX(fileInput.files![0], schema);

await writeXLSX(df, "output.xlsx");
await writeXLSX(df, "output.xlsx", { sheet: "Summary" });
// Multi-sheet — call writeXLSX repeatedly on the same path
await writeXLSX(df1, "data.xlsx", { sheet: "Sales" });
await writeXLSX(df2, "data.xlsx", { sheet: "Products" });
```

Excel dates are auto-converted to JS `Date` objects. Missing-value handling matches CSV: empty cells and `naValues` strings are coerced to `null` (with `.nullable()`) or `undefined` (with `.optional()`) before Zod validation.

```typescript
const schema = z.object({
  id: z.number(),
  weight_kg: z.number().optional(),   // empty / "NA" → undefined
  height_cm: z.number().nullable(),   // empty / "NA" → null
});
const df = await readXLSX("data.xlsx", schema);
```

## JSON

```typescript
import { readJSON, writeJSON } from "@tidy-ts/dataframe";
import { z } from "zod";

// Array of objects → DataFrame
const UserSchema = z.array(z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
}));
const users = await readJSON("users.json", UserSchema);

// Parse JSON strings (no file needed) — same signature
const jsonString = '[{"name": "Alice", "age": 30}]';
const df = await readJSON(jsonString, UserSchema);

// Single object (non-array) → returns the validated object directly
const ConfigSchema = z.object({ apiUrl: z.string().url(), timeout: z.number() });
const config = await readJSON("config.json", ConfigSchema);

// Type coercion at the schema layer
const CoercedSchema = z.array(z.object({
  id: z.coerce.number(),       // "123" → 123
  active: z.coerce.boolean(),  // "true" → true
}));

// Write
await writeJSON("users.json", df);
await writeJSON("data.json", df, {
  formatDate: (date) => date.toISOString().split("T")[0],
});
```

## Arrow (`@tidy-ts/arrow`)

```typescript
import { readArrow, writeArrow } from "@tidy-ts/arrow";

const df = await readArrow("data.arrow", schema);

// Or from a buffer, with column selection and Date conversion
const buffer = await Deno.readFile("data.arrow");
const df2 = await readArrow(buffer, schema, {
  columns: ["id", "name"],
  useDate: true,
  // useBigInt: true,  // for very large integers
});

// Write — async, like readArrow
await writeArrow(df, "output.arrow");
```

Use Arrow for efficient inter-process data exchange.

## Parquet (`@tidy-ts/parquet`)

```typescript
import { readParquet, writeParquet } from "@tidy-ts/parquet";

const df = await readParquet("data.parquet", schema);

// Column + row range selection
const df2 = await readParquet("data.parquet", schema, {
  columns: ["id", "name"],
  rowStart: 0,
  rowEnd: 1000,
});

writeParquet(df, "output.parquet");  // requires static import
```

Best for large datasets — efficient columnar on-disk format.

## Anti-patterns

- ❌ `no_types: true` when the schema is known at compile time — you lose autocomplete and type narrowing.
- ❌ Guessing column types — run `peekCSV` / `peekXLSX` first.
- ❌ Calling `JSON.parse` directly for tabular data — use `readJSON` with a schema.
- ❌ Reading huge files into memory when only a subset is needed — pass `columns` (Arrow / Parquet) or `rowStart` / `rowEnd` (Parquet).
- ❌ Forgetting `await` on the reader — they're all async.
