import type { DocEntry } from "../mcp-types.ts";

export const csvDocs: Record<string, DocEntry> = {
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
};
