import type { DocEntry } from "../mcp-types.ts";

export const jsonDocs: Record<string, DocEntry> = {
  readJSON: {
    name: "readJSON",
    category: "io",
    signature:
      "readJSON<T>(pathOrContent: string, schema: ZodSchema<T>): Promise<DataFrame<T> | T>",
    description:
      "Read JSON from a file or parse a JSON string with Zod schema validation. Accepts either a file path or raw JSON content string. Returns a DataFrame for array of objects, or validated data for other schemas. Automatically infers types from schema.",
    imports: [
      'import { readJSON } from "@tidy-ts/dataframe";',
      'import { z } from "zod";',
    ],
    parameters: [
      "pathOrContent: File path to JSON file (Node.js/Deno) OR raw JSON content string",
      "schema: Zod schema for validation and type inference",
    ],
    returns:
      "Promise<DataFrame<T>> for array of objects, or Promise<T> for other types",
    examples: [
      '// Read array of objects as DataFrame from file\nconst UserSchema = z.array(z.object({\n  id: z.number(),\n  name: z.string(),\n  email: z.string().email(),\n}));\nconst users = await readJSON("users.json", UserSchema)',
      '// Parse JSON string directly (no file needed)\nconst jsonString = \'[{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}]\';\nconst UserSchema = z.array(z.object({\n  name: z.string(),\n  age: z.number(),\n}));\nconst df = await readJSON(jsonString, UserSchema);\n// df is DataFrame<{name: string, age: number}>',
      '// Parse API response\nconst response = await fetch("https://api.example.com/users");\nconst jsonString = await response.text();\nconst df = await readJSON(jsonString, UserSchema);',
      '// Read configuration object from file\nconst ConfigSchema = z.object({\n  apiUrl: z.string().url(),\n  timeout: z.number().positive(),\n});\nconst config = await readJSON("config.json", ConfigSchema)',
      '// With type coercion (strings to numbers)\nconst CoercedSchema = z.array(z.object({\n  id: z.coerce.number(),  // "123" → 123\n  price: z.coerce.number(),  // "9.99" → 9.99\n  active: z.coerce.boolean(),  // "true" → true\n}));\nconst df = await readJSON(jsonString, CoercedSchema);',
    ],
    related: ["writeJSON", "readCSV", "createDataFrame"],
    bestPractices: [
      "✓ GOOD: Works with both file paths and JSON strings",
      "✓ GOOD: Use z.array(z.object({...})) to get a DataFrame",
      "✓ GOOD: Zod schema provides automatic type validation and conversion",
      "✓ GOOD: Use z.coerce for type conversion (string → number)",
    ],
    antiPatterns: [
      "❌ BAD: Using JSON.parse without validation - use readJSON with a schema instead",
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
