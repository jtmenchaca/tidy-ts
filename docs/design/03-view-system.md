# View System (Lazy Evaluation)

## Design Goals and Implementation

| Design Goal | Implementation |
|------------|----------------|
| **Avoid copying data for filters** | Store a lightweight BitSet (1 bit per row) marking which rows to keep. No data is copied until you actually access it. |
| **Avoid copying data for sorting** | Store an index array mapping logical position → physical row. Sorting only rearranges the index, not the data. |
| **Make chained operations fast** | Each filter/sort just adds metadata. No data copying until materialization. |
| **Save memory** | Views are tiny: ~4 bytes per row for index, ~0.125 bytes per row for mask. Much smaller than copying entire DataFrames. |
| **Defer expensive work** | Materialization (combining index + mask) only happens when you access data. If you never access, you never pay the cost. |
| **Cache materialization results** | Once computed, the materialized index is cached. Subsequent accesses are fast. |

## How It Works

### Filtering

When you do `df.filter(row => row.age > 18)`:

1. **Create BitSet**: Allocate tiny bit array (1 bit per row)
2. **Evaluate predicate**: For each row, set bit if predicate is true
3. **Store mask**: Save BitSet in view
4. **No data copy**: Original data untouched

**Memory**: For 1M rows, BitSet is 125KB vs 1MB for boolean array (87.5% savings)

### Sorting

When you do `df.arrange("age")`:

1. **Create index**: Start with `[0, 1, 2, ...]`
2. **Sort index**: Rearrange index based on column values
3. **Store index**: Save sorted index in view
4. **No data copy**: Original data untouched

**Memory**: Only 4 bytes per row for index array

### Materialization

When you access data (e.g., `df.toArray()`):

1. **Check cache**: If already computed, return cached result
2. **Combine index + mask**: Filter index through mask bits
3. **Cache result**: Save for future accesses
4. **Use result**: Access data using materialized index

## View Propagation

| Goal | Implementation |
|------|----------------|
| **Preserve views through value changes** | `mutate()` keeps the view - values change but structure same |
| **Preserve views through column changes** | `select()` keeps the view - columns change but rows same |
| **Materialize when needed** | Views materialize automatically when accessing data (toArray, iteration, column access) |

## Performance

| Operation | Cost | When Paid |
|-----------|------|-----------|
| Create filter | O(N) - evaluate predicate | Immediately |
| Create sort | O(N log N) - sort index | Immediately |
| Materialize | O(N) - combine index + mask | On first data access |
| Access with view | O(N) - filter column array | Every column access |
| Access cached | O(1) - use cached index | After first materialization |

## Trade-offs

**What we get:**
- Massive memory savings (no data copy)
- Fast operation chaining (just metadata)
- Deferred computation (only pay when needed)

**What we trade:**
- Materialization overhead when accessing data
- Column access slower with views (must filter)
- Complex view combinations can be slower than materializing early

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| **Empty filter result** | Mask has no set bits, materialized index is empty array `[]` |
| **Multiple arranges** | Each arrange replaces the index (doesn't chain) |
| **View + COW** | Views work on top of COW stores, materialization respects both |
