import type { DocEntry } from "../mcp-types.ts";

export const jsonDocs: Record<string, DocEntry> = {
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
};
