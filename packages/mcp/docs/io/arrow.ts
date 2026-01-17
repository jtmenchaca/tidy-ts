import type { DocEntry } from "../mcp-types.ts";

export const arrowDocs: Record<string, DocEntry> = {
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

