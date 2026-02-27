import type { DocEntry } from "../mcp-types.ts";

export const xlsxDocs: Record<string, DocEntry> = {
  readXLSX: {
    name: "readXLSX",
    category: "io",
    signature:
      "readXLSX<T>(pathOrBuffer: string | ArrayBuffer | File | Blob, schema: ZodSchema<T>, opts?: ReadXLSXOpts): Promise<DataFrame<T>>",
    description:
      "Read XLSX file with Zod schema validation and sheet selection. Returns a DataFrame that you can use with all DataFrame operations (filter, mutate, groupBy, etc.). If you don't know the schema, use peekXLSX() first to inspect sheet names, preview data structure, and generate an appropriate schema. Supports file paths (Node.js/Deno) or ArrayBuffer/File/Blob (all environments including browsers).",
    imports: [
      'import { readXLSX, peekXLSX } from "@tidy-ts/dataframe";',
      'import { z } from "zod";',
    ],
    parameters: [
      "pathOrBuffer: File path (Node.js/Deno) or ArrayBuffer/File/Blob (all environments including browsers)",
      "schema: Zod schema for type validation and conversion",
      "opts.sheet: Sheet name or index (default: first sheet)",
      "opts.skip: Number of rows to skip (useful if first row is a title, not headers)",
    ],
    returns:
      "Promise<DataFrame<T>> - A typed DataFrame object with all standard operations",
    examples: [
      '// RECOMMENDED: Use peekXLSX first to understand file structure\nconst info = await peekXLSX("data.xlsx");\nconsole.log(info); // Shows sheets, headers, preview, and example schema',
      '// With Zod schema validation (file path)\nimport { z } from "zod";\n\nconst schema = z.object({\n  id: z.number(),\n  name: z.string(),\n  age: z.number(),\n  email: z.string().email(),\n  createdAt: z.date(), // Excel dates auto-converted\n});\n\nconst df = await readXLSX("data.xlsx", schema)',
      "// Browser-compatible: Read from File object\nconst fileInput = document.querySelector('input[type=\"file\"]');\nconst file = fileInput.files[0];\nconst df = await readXLSX(file, schema)",
      '// With nullable fields and specific sheet\nimport { z } from "zod";\n\nconst schema = z.object({\n  species: z.string(),\n  bill_length_mm: z.number().nullable(),\n  bill_depth_mm: z.number().nullable(),\n  body_mass_g: z.number(),\n});\n\nconst df = await readXLSX("data.xlsx", schema, { sheet: "Summary" })',
      '// Skip header rows (e.g., if row 0 is a title)\nimport { z } from "zod";\n\nconst schema = z.object({\n  name: z.string(),\n  value: z.number(),\n});\n\nconst df = await readXLSX("data.xlsx", schema, { skip: 1 })',
      '// Chain with DataFrame operations\nimport { z } from "zod";\nimport { stats as s } from "@tidy-ts/dataframe";\n\nconst schema = z.object({\n  region: z.string(),\n  amount: z.number(),\n});\n\nconst result = await readXLSX("sales.xlsx", schema)\n  .filter(r => r.amount > 100)\n  .groupBy("region")\n  .summarize({ total: g => s.sum(g.amount) })',
    ],
    related: ["peekXLSX", "writeXLSX", "readCSV", "readXLSXMetadata"],
    bestPractices: [
      "✓ GOOD: Use peekXLSX() first to inspect sheets, headers, and generate a schema",
      "✓ GOOD: Always provide a Zod schema for type safety and automatic type conversion",
      "✓ GOOD: Use skip option if first row is a title/note rather than column headers",
      "✓ GOOD: Chain DataFrame operations immediately after reading",
      "✓ GOOD: Use .nullable() for columns that may have missing values",
    ],
    antiPatterns: [
      "❌ BAD: Using no_types: true - you lose all type safety and autocomplete. Use peekXLSX() to understand the schema first.",
      "❌ BAD: Guessing column types - use peekXLSX() to see actual data before defining schema",
    ],
  },

  peekXLSX: {
    name: "peekXLSX",
    category: "io",
    signature:
      "peekXLSX(path: string, options?: { previewRows?: number, sheet?: string | number }): Promise<string>",
    description:
      "Inspect an XLSX file and return a markdown-formatted description of its structure. Shows available sheets, column headers, data preview, and a suggested Zod schema. This is the recommended way to understand an XLSX file before reading it with readXLSX().",
    imports: ['import { peekXLSX, readXLSX } from "@tidy-ts/dataframe";'],
    parameters: [
      "path: File path to XLSX file",
      "options.previewRows: Number of rows to preview (default: 5)",
      "options.sheet: Which sheet to preview - name or index (default: first sheet)",
    ],
    returns:
      "Promise<string> - Markdown-formatted description of file structure",
    examples: [
      '// Inspect file structure (returns markdown)\nconst info = await peekXLSX("data.xlsx");\nconsole.log(info);\n// Output includes:\n// - Available sheets\n// - Column headers\n// - Data preview\n// - Example Zod schema',
      '// Preview a specific sheet\nconst info = await peekXLSX("data.xlsx", { sheet: "Summary" })',
      '// Preview by sheet index (0-based)\nconst info = await peekXLSX("data.xlsx", { sheet: 1 })',
      '// Get more preview rows\nconst info = await peekXLSX("data.xlsx", { previewRows: 10 })',
    ],
    related: ["readXLSX", "readXLSXMetadata", "peekCSV", "peek"],
    bestPractices: [
      "✓ GOOD: Use peekXLSX() first to understand file structure before reading",
      "✓ GOOD: Copy the suggested schema from the output and customize types",
      "✓ GOOD: Use the preview to identify nullable columns and data patterns",
      "✓ GOOD: Check if first row looks like a title (needs skip: 1)",
    ],
  },

  readXLSXMetadata: {
    name: "readXLSXMetadata",
    category: "io",
    signature:
      "readXLSXMetadata(pathOrBuffer: string | ArrayBuffer | File | Blob, { previewRows?: number, sheet?: string | number }): Promise<XLSXMetadata>",
    description:
      "Read metadata about an XLSX file without full parsing. Returns a structured object with sheets, headers, and preview rows. For a more user-friendly output, consider using peekXLSX() which returns formatted markdown with a suggested schema.",
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
    ],
    related: ["peekXLSX", "readXLSX"],
    bestPractices: [
      "✓ GOOD: Use peekXLSX() for human/AI-readable output with suggested schema",
      "✓ GOOD: Use readXLSXMetadata() when you need programmatic access to metadata",
    ],
  },

  writeXLSX: {
    name: "writeXLSX",
    category: "io",
    signature:
      "writeXLSX<T>(df: DataFrame<T>, path: string, opts?: { sheet?: string }): Promise<void>",
    description:
      "Write DataFrame to XLSX file. Zero external dependencies. In browser environments, triggers a file download instead of writing to disk. Handles strings, numbers, booleans, and dates (converted to Excel serial numbers).",
    imports: ['import { writeXLSX } from "@tidy-ts/dataframe";'],
    parameters: [
      "df: DataFrame to write",
      "path: Output file path (Node.js/Deno/Bun) or download filename (browser)",
      'opts.sheet: Sheet name (default: "Sheet1")',
    ],
    returns: "Promise<void>",
    examples: [
      '// Write to file (Node.js/Deno/Bun)\nawait writeXLSX(df, "output.xlsx")',
      '// Write to specific sheet\nawait writeXLSX(df, "output.xlsx", { sheet: "Summary" })',
      '// Browser: triggers download\nawait writeXLSX(df, "report.xlsx")',
      '// Add sheet to existing file (Node.js/Deno/Bun only)\nawait writeXLSX(df1, "data.xlsx", { sheet: "Sales" })\nawait writeXLSX(df2, "data.xlsx", { sheet: "Products" })',
    ],
    related: ["readXLSX", "writeCSV"],
    bestPractices: [
      "✓ GOOD: Works in all environments - file system in Node.js/Deno/Bun, download in browser",
      "✓ GOOD: Use sheet option to organize data into multiple sheets",
      "✓ GOOD: Dates are automatically converted to Excel format",
    ],
  },
};
