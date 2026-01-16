import type { DocEntry } from "../mcp-types.ts";

export const jsonDocs: Record<string, DocEntry> = {
  readJSON: {
    name: "readJSON",
    category: "io",
    signature:
      "readJSON<T>(filePath: string, schema: ZodSchema<T>): Promise<DataFrame<T> | T>",
    description:
      "Read JSON file with Zod schema validation. Returns a DataFrame for array of objects, or validated data for other schemas. Automatically infers types from schema. For parsing JSON strings (not files), see parseJSONString pattern below.",
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
      '// Read array of objects as DataFrame from file\nconst UserSchema = z.array(z.object({\n  id: z.number(),\n  name: z.string(),\n  email: z.string().email(),\n}));\nconst users = await readJSON("users.json", UserSchema)',
      '// Read configuration object from file\nconst ConfigSchema = z.object({\n  apiUrl: z.string().url(),\n  timeout: z.number().positive(),\n});\nconst config = await readJSON("config.json", ConfigSchema)',
    ],
    related: ["writeJSON", "readCSV", "parseJSONString"],
    bestPractices: [
      "✓ GOOD: Use z.array(z.object({...})) to get a DataFrame",
      "✓ GOOD: Zod schema provides automatic type validation and conversion",
      "✓ GOOD: For JSON strings, use parseJSONString pattern instead",
    ],
  },

  parseJSONString: {
    name: "parseJSONString",
    category: "io",
    signature:
      "Parse JSON string → Validate with Zod → createDataFrame()",
    description:
      "Pattern for loading data from a JSON string (not a file) into a DataFrame with Zod schema validation. This is a common pattern for API responses, WebSocket messages, or embedded JSON data.",
    imports: [
      'import { createDataFrame } from "@tidy-ts/dataframe";',
      'import { z } from "zod";',
    ],
    parameters: [
      "jsonString: The JSON string to parse",
      "schema: Zod schema for validation (use z.array(z.object({...})) for DataFrame)",
    ],
    returns: "DataFrame<T> with validated, typed rows",
    examples: [
      '// Parse JSON string into DataFrame with Zod validation\nimport { z } from "zod";\nimport { createDataFrame } from "@tidy-ts/dataframe";\n\nconst jsonString = \'[{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}]\';\n\nconst UserSchema = z.array(z.object({\n  name: z.string(),\n  age: z.number(),\n}));\n\n// Parse and validate\nconst parsed = UserSchema.parse(JSON.parse(jsonString));\nconst df = createDataFrame(parsed);\n// df is DataFrame<{name: string, age: number}>',
      '// With error handling using safeParse\nconst result = UserSchema.safeParse(JSON.parse(jsonString));\nif (result.success) {\n  const df = createDataFrame(result.data);\n  df.print();\n} else {\n  console.error("Validation failed:", result.error.issues);\n}',
      '// From API response\nconst response = await fetch("https://api.example.com/users");\nconst jsonString = await response.text();\nconst validated = UserSchema.parse(JSON.parse(jsonString));\nconst df = createDataFrame(validated);',
      '// With type coercion (strings to numbers)\nconst CoercedSchema = z.array(z.object({\n  id: z.coerce.number(),  // "123" → 123\n  price: z.coerce.number(),  // "9.99" → 9.99\n  active: z.coerce.boolean(),  // "true" → true\n}));\nconst df = createDataFrame(CoercedSchema.parse(JSON.parse(jsonString)));',
    ],
    related: ["readJSON", "createDataFrame", "readCSVString"],
    bestPractices: [
      "✓ GOOD: Use z.array(z.object({...})) for DataFrame-compatible validation",
      "✓ GOOD: Use safeParse() for graceful error handling",
      "✓ GOOD: Use z.coerce for type conversion (string → number)",
      "✓ GOOD: Define schema once, reuse for multiple parses",
    ],
    antiPatterns: [
      "❌ BAD: Using JSON.parse without validation - loses type safety",
      "❌ BAD: Wrapping in try/catch without proper error messages",
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
