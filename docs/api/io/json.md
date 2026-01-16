# Json

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [readJSON](#readjson)
- [writeJSON](#writejson)

---

## readJSON

Read JSON file with Zod schema validation. Returns a DataFrame for array of objects, or validated data for other schemas. Automatically infers types from schema.

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
// Read array of objects as DataFrame
const UserSchema = z.array(z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
}));
const users = await readJSON("users.json", UserSchema)
// Read configuration object
const ConfigSchema = z.object({
  apiUrl: z.string().url(),
  timeout: z.number().positive(),
});
const config = await readJSON("config.json", ConfigSchema)
```

### Best Practices

- ✓ GOOD: Use z.array(z.object({...})) to get a DataFrame
- ✓ GOOD: Zod schema provides automatic type validation and conversion

### Related

`writeJSON`, `readCSV`

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
