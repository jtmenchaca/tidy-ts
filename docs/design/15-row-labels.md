# Row Labels System

## Design Goals and Implementation

| Design Goal | Implementation |
|------------|----------------|
| **Reversible transpose operations** | Store row labels so `transpose()` can preserve row identity. Transpose again restores original structure. |
| **No performance impact** | Row labels stored separately from columnar storage. Zero overhead when not used. |
| **Preserve row identity** | Labels preserved through operations. Rows keep their identity even after transformations. |
| **Default labels** | Automatically generates labels `["0", "1", "2", ...]` if not provided. |
| **Custom labels** | Can set custom labels via `setRowLabels()`. Useful for named rows. |

## Structure

```typescript
RowLabelStore {
  labelToIndex: Map<RowLabel, number>;  // Label → row index
  indexToLabel: RowLabel[];              // Row index → label
  length: number;
}
```

## How It Works

| Goal | Implementation |
|------|----------------|
| **Enable reversible transpose** | When transposing, rows become columns with original labels. Transpose again uses labels to restore structure. |
| **Store separately** | Labels in `__rowLabels` metadata, separate from `__store`. No impact on columnar operations. |
| **Preserve through operations** | Labels copied to new DataFrames in operations. Row identity maintained. |

## Benefits

- **Reversible operations**: Transpose works both ways
- **Row identity**: Rows keep their labels through transformations
- **Zero overhead**: No cost when not used
- **Flexible**: Default or custom labels
