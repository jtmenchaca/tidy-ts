import type { DocEntry } from "./mcp-types.ts";

export const ioDocs: Record<string, DocEntry> = {
  readCSV: {
    name: "readCSV",
    category: "io",
    signature:
      "readCSV<T>(pathOrContent: string, schema?: ZodSchema<T>, opts?: CsvOptions): Promise<DataFrame<T>>\nreadCSV(pathOrContent: string, opts: { no_types: true }): Promise<DataFrame<any>>\nreadCSV<T>(pathOrContent: string, schema: ZodSchema<T>, opts: { no_types: true }): Promise<DataFrame<any>>",
    description:
      "Read CSV file or parse CSV content with optional Zod schema validation. Returns a DataFrame that you can use with all DataFrame operations. Use readCSVMetadata() first to inspect headers and preview data structure. When `no_types: true`, returns DataFrame<any> without strict type checking, useful for dynamic or unknown schemas.",
    imports: [
      'import { readCSV, writeCSV, readCSVMetadata } from "@tidy-ts/dataframe";',
      'import { z } from "zod";',
    ],
    parameters: [
      "pathOrContent: File path to CSV or raw CSV content string",
      "schema: Optional Zod schema for validation and type conversion (required unless no_types is true)",
      "opts.comma: Field delimiter/comma character (default: ',')",
      "opts.skipEmptyLines: Skip empty lines (default: true)",
      "opts.no_types: When true, returns DataFrame<any> instead of typed DataFrame. Schema is optional when true.",
    ],
    returns:
      "Promise<DataFrame<T>> or Promise<DataFrame<any>> - A DataFrame object with all standard operations",
    examples: [
      '// Read from file with Zod schema\nimport { z } from "zod";\n\nconst schema = z.object({\n  id: z.number(),\n  name: z.string(),\n  age: z.number(),\n  email: z.string().email(),\n});\n\nconst df = await readCSV("data.csv", schema)',
      '// Parse from string with schema\nimport { z } from "zod";\n\nconst csv = "name,age\\nAlice,30\\nBob,25";\nconst schema = z.object({\n  name: z.string(),\n  age: z.number(),\n});\nconst df = await readCSV(csv, schema)',
      '// Without schema - returns DataFrame<any>\nconst df = await readCSV("data.csv", { no_types: true })\n// All values remain as strings, but methods work',
      '// With schema but no_types - validation occurs but returns DataFrame<any>\nconst df = await readCSV("data.csv", schema, { no_types: true })',
      '// With nullable fields and custom delimiter\nimport { z } from "zod";\n\nconst schema = z.object({\n  id: z.number(),\n  name: z.string(),\n  score: z.number().nullable(),\n});\nconst df = await readCSV("data.tsv", schema, { comma: "\\t", naValues: [""] })',
      '// Chain with DataFrame operations\nimport { z } from "zod";\nimport { stats as s } from "@tidy-ts/dataframe";\n\nconst schema = z.object({\n  region: z.string(),\n  amount: z.number(),\n});\nconst result = await readCSV("sales.csv", schema)\n  .filter(r => r.amount > 100)\n  .groupBy("region")\n  .summarize({ total: g => s.sum(g.amount) })',
    ],
    related: ["writeCSV", "readCSVMetadata", "readXLSX"],
    bestPractices: [
      "✓ GOOD: Use readCSVMetadata() first to inspect headers and structure",
      "✓ GOOD: Provide a Zod schema for type safety and automatic type conversion",
      "✓ GOOD: Use no_types: true when schema is unknown or dynamic",
      "✓ GOOD: Works with both file paths and raw CSV strings",
    ],
    antiPatterns: [
      "❌ BAD: Using no_types when you know the schema - you lose type safety",
      "❌ BAD: Reading large files without schema - use streaming readCSVStream instead",
    ],
  },

  readCSVMetadata: {
    name: "readCSVMetadata",
    category: "io",
    signature:
      "readCSVMetadata(pathOrContent: string, { previewRows?: number, comma?: string }): Promise<CSVMetadata>",
    description:
      "Read metadata about a CSV file without full parsing. Shows column headers and a preview of the first few rows. Use this before readCSV() to understand the file structure and determine the appropriate schema.",
    imports: [
      'import { readCSVMetadata, readCSV } from "@tidy-ts/dataframe";',
    ],
    parameters: [
      "pathOrContent: File path to CSV or raw CSV content string",
      "previewRows: Number of rows to preview (default: 5)",
      'comma: Field delimiter/comma character (default: ",")',
    ],
    returns:
      "Promise<{ headers: string[], totalRows: number, firstRows: string[][], delimiter: string }>",
    examples: [
      '// Inspect file structure\nconst meta = await readCSVMetadata("data.csv")\nconsole.log("Columns:", meta.headers)\nconsole.log("Preview:", meta.firstRows)',
      '// Build schema from headers\nimport { z } from "zod";\n\nconst meta = await readCSVMetadata("data.csv")\nconst schema = z.object({\n  id: z.number(),\n  name: z.string(),\n  age: z.number(),\n  email: z.string().email().optional(),\n})\nconst df = await readCSV("data.csv", schema)',
      '// Preview TSV file\nconst meta = await readCSVMetadata("data.tsv", { comma: "\\t" })',
    ],
    related: ["readCSV"],
    bestPractices: [
      "✓ GOOD: Use before readCSV to understand file structure",
      "✓ GOOD: Check headers to determine appropriate Zod schema",
      "✓ GOOD: Inspect preview to identify data types and missing values",
    ],
  },

  writeCSV: {
    name: "writeCSV",
    category: "io",
    signature: "writeCSV<T>(df: DataFrame<T>, path: string): Promise<void>",
    description: "Write DataFrame to CSV file.",
    imports: [
      'import { readCSV, writeCSV, readXLSX, writeXLSX } from "@tidy-ts/dataframe";',
    ],
    parameters: [
      "df: DataFrame to write",
      "path: Output file path",
    ],
    returns: "Promise<void>",
    examples: [
      'await writeCSV(df, "output.csv")',
    ],
    related: ["readCSV", "writeXLSX", "writeParquet"],
  },

  readXLSX: {
    name: "readXLSX",
    category: "io",
    signature:
      "readXLSX<T>(pathOrBuffer: string | ArrayBuffer | File | Blob, schema?: ZodSchema<T>, opts?: ReadXLSXOpts): Promise<DataFrame<T>>\nreadXLSX(pathOrBuffer: string | ArrayBuffer | File | Blob, opts: { no_types: true }): Promise<DataFrame<any>>\nreadXLSX<T>(pathOrBuffer: string | ArrayBuffer | File | Blob, schema: ZodSchema<T>, opts: { no_types: true }): Promise<DataFrame<any>>",
    description:
      "Read XLSX file with optional schema validation and sheet selection. Returns a DataFrame that you can use with all DataFrame operations (filter, mutate, groupBy, etc.). Use readXLSXMetadata() first to inspect sheet names and preview data structure. When `no_types: true`, returns DataFrame<any> without strict type checking and preserves original types from XLSX (numbers, booleans). Supports file paths (Node.js/Deno) or ArrayBuffer/File/Blob (all environments including browsers).",
    imports: [
      'import { readCSV, writeCSV, readXLSX, writeXLSX, readXLSXMetadata } from "@tidy-ts/dataframe";',
      'import { z } from "zod";',
    ],
    parameters: [
      "pathOrBuffer: File path (Node.js/Deno) or ArrayBuffer/File/Blob (all environments including browsers)",
      "schema: Optional Zod schema for type validation and conversion (required unless no_types is true)",
      "opts.sheet: Sheet name or index (default: first sheet)",
      "opts.skip: Number of rows to skip (useful if first row is a title, not headers)",
      "opts.no_types: When true, returns DataFrame<any> instead of typed DataFrame. Schema is optional when true. Preserves original XLSX types (numbers, booleans).",
    ],
    returns:
      "Promise<DataFrame<T>> or Promise<DataFrame<any>> - A DataFrame object with all standard operations",
    examples: [
      '// With Zod schema validation (file path)\nimport { z } from "zod";\n\nconst schema = z.object({\n  id: z.number(),\n  name: z.string(),\n  age: z.number(),\n  email: z.string().email(),\n  createdAt: z.date(), // Excel dates auto-converted\n});\n\nconst df = await readXLSX("data.xlsx", schema)',
      '// Without schema - returns DataFrame<any>\nconst df = await readXLSX("data.xlsx", { no_types: true })\n// Types are inferred from XLSX (numbers, booleans preserved)',
      '// With schema but no_types - validation occurs but returns DataFrame<any>\nconst df = await readXLSX("data.xlsx", schema, { no_types: true })',
      "// Browser-compatible: Read from File object\nconst fileInput = document.querySelector('input[type=\"file\"]');\nconst file = fileInput.files[0];\nconst df = await readXLSX(file, schema, { no_types: true })",
      "// Browser-compatible: Read from ArrayBuffer\nconst arrayBuffer = await file.arrayBuffer();\nconst df = await readXLSX(arrayBuffer, { no_types: true })",
      '// With nullable fields and specific sheet\nimport { z } from "zod";\n\nconst schema = z.object({\n  species: z.string(),\n  bill_length_mm: z.number().nullable(),\n  bill_depth_mm: z.number().nullable(),\n  body_mass_g: z.number(),\n});\n\nconst df = await readXLSX("data.xlsx", schema, { sheet: "Summary" })',
      '// Skip header rows (e.g., if row 0 is a title)\nimport { z } from "zod";\n\nconst schema = z.object({\n  name: z.string(),\n  value: z.number(),\n});\n\nconst df = await readXLSX("data.xlsx", schema, { skip: 1 })',
      '// Chain with DataFrame operations\nimport { z } from "zod";\nimport { stats as s } from "@tidy-ts/dataframe";\n\nconst schema = z.object({\n  region: z.string(),\n  amount: z.number(),\n});\n\nconst result = await readXLSX("sales.xlsx", schema)\n  .filter(r => r.amount > 100)\n  .groupBy("region")\n  .summarize({ total: g => s.sum(g.amount) })',
    ],
    related: ["writeXLSX", "readCSV", "readXLSXMetadata"],
    bestPractices: [
      "✓ GOOD: Use readXLSXMetadata() first to inspect sheets and preview structure",
      "✓ GOOD: Use skip option if first row is a title/note rather than column headers",
      "✓ GOOD: Provide a Zod schema for type safety and automatic type conversion",
      "✓ GOOD: Use no_types: true when schema is unknown or dynamic",
      "✓ GOOD: Chain DataFrame operations immediately after reading",
    ],
    antiPatterns: [
      "❌ BAD: Using no_types when you know the schema - you lose type safety",
    ],
  },

  readXLSXMetadata: {
    name: "readXLSXMetadata",
    category: "io",
    signature:
      "readXLSXMetadata(pathOrBuffer: string | ArrayBuffer | File | Blob, { previewRows?: number, sheet?: string | number }): Promise<XLSXMetadata>",
    description:
      "Read metadata about an XLSX file without full parsing. Shows available sheets, default sheet, and a preview of the first few rows. Use this before readXLSX() to understand the file structure and determine which sheet to read and whether to skip rows. Supports file paths (Node.js/Deno) or ArrayBuffer/File/Blob (all environments including browsers).",
    imports: [
      'import { readXLSXMetadata, readXLSX } from "@tidy-ts/dataframe";',
    ],
    parameters: [
      "pathOrBuffer: File path (Node.js/Deno) or ArrayBuffer/File/Blob (all environments including browsers)",
      "previewRows: Number of rows to preview (default: 5)",
      "sheet: Which sheet to preview - name or index (default: first sheet)",
    ],
    returns:
      "Promise<{ sheets: SheetInfo[], defaultSheet: string, sheetName: string, headers: string[], totalRows: number, firstRows: string[][] }>",
    examples: [
      '// Inspect file structure (file path)\nconst meta = await readXLSXMetadata("data.xlsx")\nconsole.log("Sheets:", meta.sheets)\nconsole.log("Headers:", meta.headers)\nconsole.log("Preview:", meta.firstRows)',
      '// Browser-compatible: Inspect from File object\nconst fileInput = document.querySelector(\'input[type="file"]\');\nconst file = fileInput.files[0];\nconst meta = await readXLSXMetadata(file)\nconsole.log("Sheets:", meta.sheets)',
      '// Check if first row needs to be skipped\nconst meta = await readXLSXMetadata("data.xlsx")\nif (meta.firstRows[0][0] === "Report Title") {\n  df = await readXLSX("data.xlsx", schema, { skip: 1 })\n}',
      '// Preview a specific sheet\nconst meta = await readXLSXMetadata("data.xlsx", { sheet: "Summary", previewRows: 10 })',
    ],
    related: ["readXLSX"],
    bestPractices: [
      "✓ GOOD: Use before readXLSX to understand file structure",
      "✓ GOOD: Check preview to determine if skip option is needed",
      "✓ GOOD: Verify sheet names before reading specific sheets",
    ],
  },

  writeXLSX: {
    name: "writeXLSX",
    category: "io",
    signature:
      "writeXLSX<T>(df: DataFrame<T>, path: string, opts?: { sheet?: string }): Promise<void>",
    description: "Write DataFrame to XLSX file.",
    imports: [
      'import { readCSV, writeCSV, readXLSX, writeXLSX } from "@tidy-ts/dataframe";',
    ],
    parameters: [
      "df: DataFrame to write",
      "path: Output file path",
      'opts.sheet: Sheet name (default: "Sheet1")',
    ],
    returns: "Promise<void>",
    examples: [
      'await writeXLSX(df, "output.xlsx")',
      'await writeXLSX(df, "output.xlsx", { sheet: "Summary" })',
    ],
    related: ["readXLSX", "writeCSV"],
  },

  readJSON: {
    name: "readJSON",
    category: "io",
    signature:
      "readJSON<T>(filePath: string, schema: ZodSchema<T>): Promise<DataFrame<T> | T>",
    description:
      "Read JSON file with Zod schema validation. Returns a DataFrame for array of objects, or validated data for other schemas. Automatically infers types from schema.",
    imports: [
      'import { readJSON } from "@tidy-ts/dataframe";',
    ],
    parameters: [
      "filePath: Path to JSON file (Node.js/Deno only)",
      "schema: Zod schema for validation and type inference",
    ],
    returns:
      "Promise<DataFrame<T>> for array of objects, or Promise<T> for other types",
    examples: [
      '// Read array of objects as DataFrame\nconst UserSchema = z.array(z.object({\n  id: z.number(),\n  name: z.string(),\n  email: z.string().email(),\n}));\nconst users = await readJSON("users.json", UserSchema)',
      '// Read configuration object\nconst ConfigSchema = z.object({\n  apiUrl: z.string().url(),\n  timeout: z.number().positive(),\n});\nconst config = await readJSON("config.json", ConfigSchema)',
    ],
    related: ["writeJSON", "readCSV"],
    bestPractices: [
      "✓ GOOD: Use z.array(z.object({...})) to get a DataFrame",
      "✓ GOOD: Zod schema provides automatic type validation and conversion",
    ],
  },

  writeJSON: {
    name: "writeJSON",
    category: "io",
    signature:
      "writeJSON<T>(filePath: string, dataFrame: DataFrame<T>, opts?: WriteJSONOpts): Promise<void>",
    description:
      "Write DataFrame to JSON file. Serializes each row as an object in a JSON array. Handles nested DataFrames by converting them to arrays.",
    imports: [
      'import { writeJSON } from "@tidy-ts/dataframe";',
    ],
    parameters: [
      "filePath: Path where JSON file should be written",
      "dataFrame: DataFrame to export",
      "opts.naValue: Custom NA representation (optional)",
      "opts.formatDate: Custom date formatting function (optional)",
    ],
    returns: "Promise<void>",
    examples: [
      '// Basic export\nconst df = createDataFrame([\n  { name: "Alice", age: 25 },\n  { name: "Bob", age: 30 }\n]);\nawait writeJSON("users.json", df)',
      '// With custom date formatting\nawait writeJSON("data.json", df, {\n  formatDate: (date) => date.toISOString().split("T")[0]\n})',
    ],
    related: ["readJSON", "writeCSV"],
  },

  readParquet: {
    name: "readParquet",
    category: "io",
    signature:
      "readParquet<T>(pathOrBuffer: string | ArrayBuffer, schema: ZodSchema<T>, opts?: ParquetOptions): Promise<DataFrame<T>>",
    description:
      "Read Parquet file or buffer with Zod schema validation. Supports file paths (Node.js/Deno) or ArrayBuffer (all environments). Efficient columnar format for large datasets.",
    imports: [
      'import { readParquet } from "@tidy-ts/dataframe";',
    ],
    parameters: [
      "pathOrBuffer: File path (Node.js/Deno) or ArrayBuffer",
      "schema: Zod schema for validation and type conversion",
      "opts.columns: Select specific columns (optional)",
      "opts.rowStart: Start row index (optional)",
      "opts.rowEnd: End row index (optional)",
    ],
    returns: "Promise<DataFrame<T>>",
    examples: [
      '// Read from file\nconst schema = z.object({\n  id: z.number(),\n  name: z.string(),\n});\nconst df = await readParquet("data.parquet", schema)',
      '// Read specific columns and row range\nconst df = await readParquet("data.parquet", schema, {\n  columns: ["id", "name"],\n  rowStart: 0,\n  rowEnd: 1000\n})',
    ],
    related: ["writeParquet", "readArrow", "readCSV"],
    bestPractices: [
      "✓ GOOD: Use Parquet for large datasets - efficient columnar storage",
      "✓ GOOD: Specify columns option to read only needed data",
    ],
  },

  writeParquet: {
    name: "writeParquet",
    category: "io",
    signature: "writeParquet<T>(df: DataFrame<T>, path: string): DataFrame<T>",
    description:
      "Write DataFrame to Parquet file. Automatically infers column types. Requires static import. Efficient columnar format for large datasets.",
    imports: [
      'import { writeParquet } from "@tidy-ts/dataframe/ts/verbs/utility";',
    ],
    parameters: [
      "df: DataFrame to write",
      "path: Output file path",
    ],
    returns: "DataFrame<T> - Original DataFrame for chaining",
    examples: [
      '// Write to Parquet file\nimport { writeParquet } from "@tidy-ts/dataframe/ts/verbs/utility";\n\nconst df = createDataFrame([\n  { id: 1, name: "Alice", age: 30 },\n  { id: 2, name: "Bob", age: 25 }\n]);\nwriteParquet(df, "output.parquet")',
    ],
    related: ["readParquet", "writeCSV"],
    bestPractices: [
      "⚠ NOTE: Requires static import, not available via dynamic import",
      "✓ GOOD: Use Parquet for large datasets - efficient columnar storage",
    ],
  },

  readArrow: {
    name: "readArrow",
    category: "io",
    signature:
      "readArrow<T>(pathOrBuffer: string | ArrayBuffer, schema: ZodSchema<T>, opts?: ArrowOptions): Promise<DataFrame<T>>",
    description:
      "Read Apache Arrow file or buffer with Zod schema validation. Supports file paths (Node.js/Deno) or ArrayBuffer (all environments). Efficient for inter-process data exchange.",
    imports: [
      'import { readArrow } from "@tidy-ts/dataframe";',
    ],
    parameters: [
      "pathOrBuffer: File path (Node.js/Deno) or ArrayBuffer",
      "schema: Zod schema for validation and type conversion",
      "opts.columns: Select specific columns (optional)",
      "opts.useDate: Convert timestamps to Date objects (optional)",
      "opts.useBigInt: Use BigInt for large integers (optional)",
    ],
    returns: "Promise<DataFrame<T>>",
    examples: [
      '// Read from file\nconst schema = z.object({\n  id: z.number(),\n  name: z.string(),\n  created: z.date(),\n});\nconst df = await readArrow("data.arrow", schema)',
      '// Read from ArrayBuffer\nconst buffer = await Deno.readFile("data.arrow");\nconst df = await readArrow(buffer, schema, {\n  columns: ["id", "name"],\n  useDate: true\n})',
    ],
    related: ["readParquet", "readCSV"],
    bestPractices: [
      "✓ GOOD: Use Arrow for efficient inter-process data exchange",
      "✓ GOOD: Set useDate: true to convert timestamps to Date objects",
    ],
  },
};
