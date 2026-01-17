import type { DocEntry } from "../mcp-types.ts";

export const parquetDocs: Record<string, DocEntry> = {
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
      'import { writeParquet } from "@tidy-ts/dataframe/ts/io";',
    ],
    parameters: [
      "df: DataFrame to write",
      "path: Output file path",
    ],
    returns: "DataFrame<T> - Original DataFrame for chaining",
    examples: [
      '// Write to Parquet file\nimport { writeParquet } from "@tidy-ts/dataframe/ts/io";\n\nconst df = createDataFrame([\n  { id: 1, name: "Alice", age: 30 },\n  { id: 2, name: "Bob", age: 25 }\n]);\nwriteParquet(df, "output.parquet")',
    ],
    related: ["readParquet", "writeCSV"],
    bestPractices: [
      "⚠ NOTE: Requires static import, not available via dynamic import",
      "✓ GOOD: Use Parquet for large datasets - efficient columnar storage",
    ],
  },
};

