# Counts

> Auto-generated from tidy-ts MCP documentation

## s.unique

Get unique values from an array (WASM-optimized version). Returns unique values in order of first appearance.

### Signature

```typescript
s.unique(values: T[]): T[]
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- values: Array of values to get unique values from

### Returns

T[] - array with duplicates removed in order of first appearance

### Examples

```typescript
s.unique([1, 2, 1, 3, 2]) // [1, 2, 3]
s.unique(["a", "b", "a", "c"]) // ["a", "b", "c"]
s.unique([true, false, true]) // [true, false]
```

### Related

`distinct`, `mode`

---
