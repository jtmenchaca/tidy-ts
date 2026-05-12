import type { DocEntry } from "../mcp-types.ts";

export const creationDocs: Record<string, DocEntry> = {
  createDataFrame: {
    name: "createDataFrame",
    category: "dataframe",
    signature:
      "createDataFrame<T>(data: T[] | { columns: Record<string, unknown[]> }, options?: DataFrameOptions): DataFrame<T> | DataFrame<any>",
    description:
      "Create a DataFrame from an array of row objects or from column arrays. Use the no_types option to return DataFrame<any> when type safety is not needed.",
    imports: [
      'import { createDataFrame, stats as s } from "@tidy-ts/dataframe";',
    ],
    parameters: [
      "data: Array of row objects OR { columns: { columnName: values[] } }",
      "options: Optional DataFrameOptions object with:",
      "  - schema: Zod schema for validation",
      "  - no_types: boolean (default: false) - when true, returns DataFrame<any>",
      "  - trace: boolean - enable operation tracing",
      "  - concurrency: number - concurrency limit for async operations",
    ],
    returns: "DataFrame<T> (default) or DataFrame<any> (when no_types: true)",
    examples: [
      'const df = createDataFrame([{ name: "Alice", age: 30 }, { name: "Bob", age: 25 }])',
      'const df = createDataFrame({ columns: { name: ["Alice", "Bob"], age: [30, 25] } })',
      "// With Zod schema validation (schema as second parameter)",
      'import { z } from "zod";',
      "const schema = z.object({ name: z.string(), age: z.number() });",
      'const df = createDataFrame([{ name: "Alice", age: 30 }], schema)',
      "// Use no_types for dynamic/unknown schema",
      "const dfAny = createDataFrame(userData, { no_types: true })",
    ],
    related: ["readCSV", "readXLSX", "readJSON", "zDataFrame"],
    bestPractices: [
      'Always import stats: import { createDataFrame, stats as s } from "@tidy-ts/dataframe"',
      "Use df.print() to display DataFrames; avoid console.log(df) or dumping full toRows() for inspection",
      "Access columns with df.columnName property (e.g., df.age) instead of manual extraction",
      "Use no_types: true when:",
      "  • Working with dynamic/unknown schema (user-provided data, API responses)",
      "  • Rapid prototyping (follow up with typed implementation)",
      "  • Building generic utilities for arbitrary DataFrame structures",
      "Prefer typed DataFrames when possible - no_types loses compile-time safety",
    ],
    antiPatterns: [
      "❌ BAD: Using no_types when you have not exhausted all other options",
      "❌ BAD: Using no_types when schema is known at compile time",
    ],
  },

  zDataFrame: {
    name: "zDataFrame",
    category: "dataframe",
    signature:
      "zDataFrame<T extends z.ZodRawShape>(shape: T): ZodDataFrame<{ [K in keyof T]: z.infer<T[K]> }>",
    description:
      "Build a Zod schema that parses columnar input `{ col: z.array(...) }` into a typed DataFrame, or accepts an existing DataFrame (passthrough). Use `.parse()` / `.safeParse()` like any Zod type.",
    imports: [
      'import { zDataFrame } from "@tidy-ts/dataframe";',
      'import { z } from "zod";',
    ],
    parameters: [
      "shape: ZodRawShape — per-column element schemas (wrapped internally as z.array per column)",
    ],
    returns: "ZodDataFrame<Row> — a Zod schema whose output is DataFrame<Row>",
    examples: [
      "const schema = zDataFrame({ x: z.number(), y: z.string() });",
      'const df = schema.parse({ x: [1, 2], y: ["a", "b"] });',
    ],
    related: ["createDataFrame", "readCSV"],
  },
};
