# Correlation

> Auto-generated from tidy-ts MCP documentation

## s.covariance

Calculate the sample covariance between two arrays of values. Arrays must have the same length. Returns null if no valid pairs.

### Signature

```typescript
s.covariance(x: number[], y: number[], removeNA?: boolean): number | null
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- x: First array of numbers
- y: Second array of numbers (same length as x)
- removeNA: If true, guarantees a number return (throws if no valid pairs)

### Returns

number | null

### Examples

```typescript
s.covariance([1, 2, 3], [1, 2, 3]) // 1
s.covariance([1, 2, 3], [3, 2, 1]) // -1
s.covariance([1, null, 3], [1, 2, 3], false) // null (due to null)
s.covariance([1, null, 3], [1, 2, 3], true) // 2 (ignoring null pair)
```

### Related

`s.test.correlation.pearson`, `variance`

---
