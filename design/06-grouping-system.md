# Grouping System

## Design Goals and Implementation

| Design Goal | Implementation |
|------------|----------------|
| **Fast group operations** | Use adjacency list structure (head, next, count arrays). O(1) group lookup without materializing group DataFrames. |
| **Don't create separate DataFrames per group** | Groups are just metadata (indices). Group DataFrames are created lazily only when you access them in `summarize()`. |
| **Preserve grouping through operations** | Three strategies: preserve metadata (mutate), filter columns (rename), rebuild groups (filter). Groups stay grouped automatically. |
| **Handle many groups efficiently** | Adjacency list scales well. No need to materialize all groups upfront. |
| **Track grouping keys in type** | TypeScript knows which columns you grouped by: `GroupedDataFrame<Row, "category" \| "year">`. |

## Group Preservation

| Operation Type | Strategy | Why |
|----------------|----------|-----|
| **Value-changing** (mutate, select) | Copy groups as-is | Row indices unchanged, groups still valid |
| **Column-changing** (rename, drop) | Filter grouping columns | Some grouping columns may be removed/renamed |
| **Row-changing** (filter, arrange) | Rebuild from scratch | Row indices changed, must rebuild groups |

## How Groups Work

When you do `df.groupBy("category")`:

1. **Build adjacency list**: Create arrays tracking which rows belong to which group
2. **Store metadata**: Save group structure in `__groups` property
3. **No data copy**: Original data untouched, just metadata added

When you do `grouped.summarize({ avg: g => mean(g.value) })`:

1. **Iterate groups**: Use adjacency list to find rows in each group
2. **Create group proxy**: Lazy DataFrame-like object for each group
3. **Apply function**: Call your function with group proxy
4. **Collect results**: Build result DataFrame from summaries

## Benefits

- **Fast**: O(1) group lookup
- **Memory efficient**: No group materialization until needed
- **Scalable**: Works well with many groups
- **Type-safe**: Grouping keys tracked in types
