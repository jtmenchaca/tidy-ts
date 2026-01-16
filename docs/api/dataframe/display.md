# Display

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [print](#print)
- [toString](#tostring)

---

## print

Display the DataFrame in a formatted table. Use this instead of console.log().

### Signature

```typescript
print(title?: string): void
```

### Import

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";
```

### Parameters

- title: Optional title to display above the table

### Returns

void

### Examples

```typescript
df.print()
df.print("Sales Analysis:")
result.groupBy("region").summarize({ total: g => s.sum(g.sales) }).print("Regional Totals:")
```

### Best Practices

- ✓ GOOD: df.print() - formatted table output
- ✓ GOOD: df.print('Title') - with descriptive title

### Anti-patterns

- ❌ BAD: console.log(df.toArray())
- ❌ BAD: console.log(df)

### Related

`toString`, `toArray`, `columns`, `nrows`

---

## toString

Get a string representation of the DataFrame in table format. Returns the same formatted output as print() but as a string.

### Signature

```typescript
toString(title?: string): string
```

### Import

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";
```

### Parameters

- title: Optional title to display above the table

### Returns

string - formatted table representation

### Examples

```typescript
const tableStr = df.toString()
const tableStr = df.toString("Sales Data")
console.log(df.toString()) // Manual printing
```

### Best Practices

- ✓ GOOD: Use toString() when you need the string for logging or file output
- ✓ GOOD: Use print() for direct console output (more convenient)

### Related

`print`, `toArray`

---
