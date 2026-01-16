# Profiling

> Auto-generated from tidy-ts MCP documentation

## profile

Profile a DataFrame by computing comprehensive statistics for each column. Returns a DataFrame with one row per column.

### Signature

```typescript
profile(): DataFrame<ColumnProfile>
```

### Import

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";
```

### Returns

DataFrame with columns: column, type, count, nulls, null_pct, mean, median, min, max, sd, q1, q3, iqr, variance (numeric), unique, top_values (categorical)

### Examples

```typescript
df.profile().print()
const stats = penguins.profile()
df.profile().filter(p => p.type === 'numeric')
```

### Best Practices

- Use profile() for quick exploratory data analysis
- Filter the profile result to focus on numeric or categorical columns
- Combine with .print() for immediate visual inspection

### Related

`summarize`, `mean`, `median`, `stdev`

---
