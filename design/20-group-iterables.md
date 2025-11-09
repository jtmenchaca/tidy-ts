# Group Column Iterables

## Design Goals and Implementation

| Design Goal | Implementation |
|------------|----------------|
| **Don't materialize group DataFrames** | Groups expose columns as iterables, not arrays. No need to create separate DataFrame per group. |
| **Memory efficient group access** | Access group columns lazily. Only iterate when needed. No upfront array creation. |
| **Fast column access** | Direct access via index mapping. O(1) to get column value for a row in group. |
| **Type-safe** | Preserves column types. `g.score` is typed correctly based on DataFrame row type. |
| **Support numeric indexing** | Can use `g.col[0]` to access first value. Proxy enables array-like access. |

## How It Works

When you do `grouped.summarize({ avg: g => mean(g.score) })`:

1. **Create group proxy**: Lazy DataFrame-like object for group
2. **Access column**: `g.score` returns iterable, not array
3. **Iterate on demand**: `mean()` iterates the iterable
4. **No materialization**: No group DataFrame created, no arrays allocated

## Structure

Groups expose columns as:
- `group.columnName`: Returns `Iterable<T> & { length: number }`
- Supports `group.col[0]` via Proxy
- No array materialization until iteration

## Implementation

| Goal | Implementation |
|------|----------------|
| **Lazy access** | `createColumnIterable()` creates Proxy-based accessor. Only accesses data when iterated. |
| **Index mapping** | Uses base index to map logical → physical positions. Direct column access. |
| **Caching** | Caches iterables per column for performance. Reuses iterables when accessed multiple times. |

## Benefits

- **Memory efficient**: No group DataFrame materialization
- **Fast**: Direct column access via index
- **Type-safe**: Preserves column types
- **Lazy**: Only iterates when needed
