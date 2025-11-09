# Columnar Storage

## Design Goals and Implementation

| Design Goal | Implementation |
|------------|----------------|
| **Fast column operations** | Store data in column-major format. All values for a column are stored together in a single array, making column operations cache-friendly and enabling vectorized processing. |
| **Efficient memory usage** | Column names stored once, not per row. Sparse data (missing values) handled efficiently with `undefined` placeholders. |
| **Fast DataFrame creation** | Pre-allocate all column arrays upfront to avoid array growth overhead. Use cached references to avoid repeated hash lookups during conversion. |
| **Easy column access** | Direct array access via `df.columnName` - returns the actual column array in O(1) time. |
| **Lazy row reconstruction** | Rows are reconstructed on-demand when accessed via `df[0]` or iteration. Only creates row objects when actually needed, saving memory. |
| **Handle missing data** | Missing columns in rows are filled with `undefined` automatically. No errors thrown for sparse data. |
| **Preserve column order** | Column order is preserved from the first row, with any new columns from later rows appended. |
| **Support empty DataFrames** | Empty DataFrames can be created with explicit column names, preserving schema even with no data. |

## Structure

```typescript
interface ColumnarStore {
  columns: Record<string, unknown[]>;  // Column arrays
  length: number;                       // Row count
  columnNames: string[];                // Column order
  rowLabels?: RowLabelStore;            // Optional row labels
}
```

## How It Works

### Conversion from Rows

1. **Discover columns**: One pass through all rows to find unique column names
2. **Pre-allocate**: Create all column arrays upfront with correct size
3. **Fill columns**: Copy values from rows into column arrays
4. **Handle missing**: Set `undefined` for columns not present in a row

### Access Patterns

- **Column access** (`df.columnName`): Direct array reference - O(1)
- **Row access** (`df[0]`): Reconstructs object from columns - O(C) where C = columns
- **Iteration** (`for...of df`): Yields rows one at a time, memory efficient

## Trade-offs

**What we get:**
- Fast column operations (cache-friendly, vectorizable)
- Efficient for wide DataFrames (many columns)
- Memory efficient for sparse data

**What we trade:**
- Row reconstruction has overhead (object creation)
- Less efficient for row-wise operations
- Column lookup requires hash table access
