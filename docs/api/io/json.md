# JSON

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [readJSON](#readjson)
- [writeJSON](#writejson)

---

## readJSON

Read JSON from a file or parse a JSON string with Zod schema validation. Accepts either a file path or raw JSON content string. Returns a DataFrame for array of objects, or validated data for other schemas. Automatically infers types from schema.

### Signature

```typescript
readJSON<T>(pathOrContent: string, schema: ZodSchema<T>): Promise<DataFrame<T> | T>
```

### Import

```typescript
import { readJSON } from "@tidy-ts/dataframe";
import { z } from "zod";
```

### Parameters

- pathOrContent: File path to JSON file (Node.js/Deno) OR raw JSON content string
- schema: Zod schema for validation and type inference

### Returns

Promise<DataFrame<T>> for array of objects, or Promise<T> for other types

### Examples

```typescript
// Read array of objects as DataFrame from file
const UserSchema = z.array(z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
}));
const users = await readJSON("users.json", UserSchema)
// Parse JSON string directly (no file needed)
const jsonString = '[{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}]';
const UserSchema = z.array(z.object({
  name: z.string(),
  age: z.number(),
}));
const df = await readJSON(jsonString, UserSchema);
// df is DataFrame<{name: string, age: number}>
// Parse API response
const response = await fetch("https://api.example.com/users");
const jsonString = await response.text();
const df = await readJSON(jsonString, UserSchema);
// Read configuration object from file
const ConfigSchema = z.object({
  apiUrl: z.string().url(),
  timeout: z.number().positive(),
});
const config = await readJSON("config.json", ConfigSchema)
// With type coercion (strings to numbers)
const CoercedSchema = z.array(z.object({
  id: z.coerce.number(),  // "123" → 123
  price: z.coerce.number(),  // "9.99" → 9.99
  active: z.coerce.boolean(),  // "true" → true
}));
const df = await readJSON(jsonString, CoercedSchema);
```

### Best Practices

- ✓ GOOD: Works with both file paths and JSON strings
- ✓ GOOD: Use z.array(z.object({...})) to get a DataFrame
- ✓ GOOD: Zod schema provides automatic type validation and conversion
- ✓ GOOD: Use z.coerce for type conversion (string → number)

### Anti-patterns

- ❌ BAD: Using JSON.parse without validation - use readJSON with a schema instead

### Related

`writeJSON`, `readCSV`, `createDataFrame`

---

## writeJSON

Write DataFrame to JSON file. Serializes each row as an object in a JSON array. Handles nested DataFrames by converting them to arrays.

### Signature

```typescript
writeJSON<T>(filePath: string, dataFrame: DataFrame<T>, opts?: WriteJSONOpts): Promise<void>
```

### Import

```typescript
import { writeJSON } from "@tidy-ts/dataframe";
```

### Parameters

- filePath: Path where JSON file should be written
- dataFrame: DataFrame to export
- opts.naValue: Custom NA representation (optional)
- opts.formatDate: Custom date formatting function (optional)

### Returns

Promise<void>

### Examples

```typescript
// Basic export
const df = createDataFrame([
  { name: "Alice", age: 25 },
  { name: "Bob", age: 30 }
]);
await writeJSON("users.json", df)
// With custom date formatting
await writeJSON("data.json", df, {
  formatDate: (date) => date.toISOString().split("T")[0]
})
```

### Related

`readJSON`, `writeCSV`

---
