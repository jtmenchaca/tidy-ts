# Json

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [readJSON](#readjson)
- [parseJSONString](#parsejsonstring)
- [writeJSON](#writejson)

---

## readJSON

Read JSON file with Zod schema validation. Returns a DataFrame for array of objects, or validated data for other schemas. Automatically infers types from schema. For parsing JSON strings (not files), see parseJSONString pattern below.

### Signature

```typescript
readJSON<T>(filePath: string, schema: ZodSchema<T>): Promise<DataFrame<T> | T>
```

### Import

```typescript
import { readJSON } from "@tidy-ts/dataframe";
```

### Parameters

- filePath: Path to JSON file (Node.js/Deno only)
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
// Read configuration object from file
const ConfigSchema = z.object({
  apiUrl: z.string().url(),
  timeout: z.number().positive(),
});
const config = await readJSON("config.json", ConfigSchema)
```

### Best Practices

- ✓ GOOD: Use z.array(z.object({...})) to get a DataFrame
- ✓ GOOD: Zod schema provides automatic type validation and conversion
- ✓ GOOD: For JSON strings, use parseJSONString pattern instead

### Related

`writeJSON`, `readCSV`, `parseJSONString`

---

## parseJSONString

Pattern for loading data from a JSON string (not a file) into a DataFrame with Zod schema validation. This is a common pattern for API responses, WebSocket messages, or embedded JSON data.

### Signature

```typescript
Parse JSON string → Validate with Zod → createDataFrame()
```

### Import

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";
import { z } from "zod";
```

### Parameters

- jsonString: The JSON string to parse
- schema: Zod schema for validation (use z.array(z.object({...})) for DataFrame)

### Returns

DataFrame<T> with validated, typed rows

### Examples

```typescript
// Parse JSON string into DataFrame with Zod validation
import { z } from "zod";
import { createDataFrame } from "@tidy-ts/dataframe";

const jsonString = '[{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}]';

const UserSchema = z.array(z.object({
  name: z.string(),
  age: z.number(),
}));

// Parse and validate
const parsed = UserSchema.parse(JSON.parse(jsonString));
const df = createDataFrame(parsed);
// df is DataFrame<{name: string, age: number}>
// With error handling using safeParse
const result = UserSchema.safeParse(JSON.parse(jsonString));
if (result.success) {
  const df = createDataFrame(result.data);
  df.print();
} else {
  console.error("Validation failed:", result.error.issues);
}
// From API response
const response = await fetch("https://api.example.com/users");
const jsonString = await response.text();
const validated = UserSchema.parse(JSON.parse(jsonString));
const df = createDataFrame(validated);
// With type coercion (strings to numbers)
const CoercedSchema = z.array(z.object({
  id: z.coerce.number(),  // "123" → 123
  price: z.coerce.number(),  // "9.99" → 9.99
  active: z.coerce.boolean(),  // "true" → true
}));
const df = createDataFrame(CoercedSchema.parse(JSON.parse(jsonString)));
```

### Best Practices

- ✓ GOOD: Use z.array(z.object({...})) for DataFrame-compatible validation
- ✓ GOOD: Use safeParse() for graceful error handling
- ✓ GOOD: Use z.coerce for type conversion (string → number)
- ✓ GOOD: Define schema once, reuse for multiple parses

### Anti-patterns

- ❌ BAD: Using JSON.parse without validation - loses type safety
- ❌ BAD: Wrapping in try/catch without proper error messages

### Related

`readJSON`, `createDataFrame`, `readCSVString`

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
