import type { DocEntry } from "../mcp-types.ts";

export const csvDocs: Record<string, DocEntry> = {
  readCSV: {
    name: "readCSV",
    category: "io",
    signature:
      "readCSV<T>(pathOrContent: string, schema: ZodSchema<T>, opts?: CsvOptions): Promise<DataFrame<T>>",
    description:
      "Read CSV file or parse CSV content with Zod schema validation. Returns a DataFrame that you can use with all DataFrame operations. If you don't know the schema, use peekCSV() first to inspect the file structure and generate an appropriate schema.",
    imports: [
      'import { readCSV, peekCSV } from "@tidy-ts/dataframe";',
      'import { z } from "zod";',
    ],
    parameters: [
      "pathOrContent: File path to CSV or raw CSV content string",
      "schema: Zod schema for validation and type conversion",
      "opts.comma: Field delimiter/comma character (default: ',')",
      "opts.skipEmptyLines: Skip empty lines (default: true)",
    ],
    returns: "Promise<DataFrame<T>> - A typed DataFrame object with all standard operations",
    examples: [
      '// RECOMMENDED: Use peekCSV first to understand file structure\nconst info = await peekCSV("data.csv");\nconsole.log(info); // Shows headers, preview, and example schema',
      '// Read from file with Zod schema\nimport { z } from "zod";\n\nconst schema = z.object({\n  id: z.number(),\n  name: z.string(),\n  age: z.number(),\n  email: z.string().email(),\n});\n\nconst df = await readCSV("data.csv", schema)',
      '// Parse from string with schema\nimport { z } from "zod";\n\nconst csv = "name,age\\nAlice,30\\nBob,25";\nconst schema = z.object({\n  name: z.string(),\n  age: z.number(),\n});\nconst df = await readCSV(csv, schema)',
      '// With nullable fields and custom delimiter\nimport { z } from "zod";\n\nconst schema = z.object({\n  id: z.number(),\n  name: z.string(),\n  score: z.number().nullable(),\n});\nconst df = await readCSV("data.tsv", schema, { comma: "\\t", naValues: [""] })',
      '// Chain with DataFrame operations\nimport { z } from "zod";\nimport { stats as s } from "@tidy-ts/dataframe";\n\nconst schema = z.object({\n  region: z.string(),\n  amount: z.number(),\n});\nconst result = await readCSV("sales.csv", schema)\n  .filter(r => r.amount > 100)\n  .groupBy("region")\n  .summarize({ total: g => s.sum(g.amount) })',
    ],
    related: ["peekCSV", "writeCSV", "readCSVMetadata", "readXLSX"],
    bestPractices: [
      "✓ GOOD: Use peekCSV() first to inspect file structure and generate a schema",
      "✓ GOOD: Always provide a Zod schema for type safety and automatic type conversion",
      "✓ GOOD: Works with both file paths and raw CSV strings",
      "✓ GOOD: Use .nullable() for columns that may have missing values",
    ],
    antiPatterns: [
      "❌ BAD: Using no_types: true - you lose all type safety and autocomplete. Use peekCSV() to understand the schema first.",
      "❌ BAD: Reading large files without schema - use streaming readCSVStream instead",
      "❌ BAD: Guessing column types - use peekCSV() to see actual data before defining schema",
    ],
  },

  peekCSV: {
    name: "peekCSV",
    category: "io",
    signature:
      "peekCSV(path: string, options?: { previewRows?: number, comma?: string }): Promise<string>",
    description:
      "Inspect a CSV file and return a markdown-formatted description of its structure. Shows column headers, data preview, and a suggested Zod schema. This is the recommended way to understand a CSV file before reading it with readCSV().",
    imports: ['import { peekCSV, readCSV } from "@tidy-ts/dataframe";'],
    parameters: [
      "path: File path to CSV file",
      "options.previewRows: Number of rows to preview (default: 5)",
      'options.comma: Field delimiter/comma character (default: ",")',
    ],
    returns: "Promise<string> - Markdown-formatted description of file structure",
    examples: [
      '// Inspect file structure (returns markdown)\nconst info = await peekCSV("data.csv");\nconsole.log(info);\n// Output includes:\n// - Column headers\n// - Data preview\n// - Example Zod schema',
      '// Preview TSV file\nconst info = await peekCSV("data.tsv", { comma: "\\t" })',
      '// Get more preview rows\nconst info = await peekCSV("data.csv", { previewRows: 10 })',
    ],
    related: ["readCSV", "readCSVMetadata", "peekXLSX", "peek"],
    bestPractices: [
      "✓ GOOD: Use peekCSV() first to understand file structure before reading",
      "✓ GOOD: Copy the suggested schema from the output and customize types",
      "✓ GOOD: Use the preview to identify nullable columns and data patterns",
    ],
  },

  readCSVMetadata: {
    name: "readCSVMetadata",
    category: "io",
    signature:
      "readCSVMetadata(pathOrContent: string, { previewRows?: number, comma?: string }): Promise<CSVMetadata>",
    description:
      "Read metadata about a CSV file without full parsing. Returns a structured object with headers and preview rows. For a more user-friendly output, consider using peekCSV() which returns formatted markdown.",
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
    ],
    related: ["peekCSV", "readCSV"],
    bestPractices: [
      "✓ GOOD: Use peekCSV() for human/AI-readable output with suggested schema",
      "✓ GOOD: Use readCSVMetadata() when you need programmatic access to metadata",
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

