# Arrow

> Auto-generated from tidy-ts MCP documentation

## readArrow

Read Apache Arrow file or buffer with Zod schema validation. Supports file paths (Node.js/Deno) or ArrayBuffer (all environments). Efficient for inter-process data exchange.

### Signature

```typescript
readArrow<T>(pathOrBuffer: string | ArrayBuffer, schema: ZodSchema<T>, opts?: ArrowOptions): Promise<DataFrame<T>>
```

### Import

```typescript
import { readArrow } from "@tidy-ts/dataframe";
```

### Parameters

- pathOrBuffer: File path (Node.js/Deno) or ArrayBuffer
- schema: Zod schema for validation and type conversion
- opts.columns: Select specific columns (optional)
- opts.useDate: Convert timestamps to Date objects (optional)
- opts.useBigInt: Use BigInt for large integers (optional)

### Returns

Promise<DataFrame<T>>

### Examples

```typescript
// Read from file
const schema = z.object({
  id: z.number(),
  name: z.string(),
  created: z.date(),
});
const df = await readArrow("data.arrow", schema)
// Read from ArrayBuffer
const buffer = await Deno.readFile("data.arrow");
const df = await readArrow(buffer, schema, {
  columns: ["id", "name"],
  useDate: true
})
```

### Best Practices

- ✓ GOOD: Use Arrow for efficient inter-process data exchange
- ✓ GOOD: Set useDate: true to convert timestamps to Date objects

### Related

`readParquet`, `readCSV`

---
