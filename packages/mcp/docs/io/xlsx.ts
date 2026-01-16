import type { DocEntry } from "../mcp-types.ts";

export const xlsxDocs: Record<string, DocEntry> = {
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
};
