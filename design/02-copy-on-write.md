# Copy-on-Write (COW)

## Design Goals and Implementation

| Design Goal | Implementation |
|------------|----------------|
| **Save memory when chaining operations** | Share unmodified column arrays between DataFrames via reference. Only copy columns that actually change. |
| **Make operations fast** | Copying a reference is O(1) - much faster than copying entire arrays. Operations that modify few columns are very fast. |
| **Be transparent to users** | Users don't need to think about memory management. COW happens automatically behind the scenes. |
| **Support column drops** | Dropped columns are excluded from new store, but original arrays remain until garbage collected. |
| **Support column renames** | Renamed columns share the same array, just update the name in metadata. No data copy needed. |
| **Handle empty updates** | If no columns change, all columns are shared. New DataFrame is essentially a lightweight wrapper. |

## How It Works

When you do `df.mutate({ newCol: ... })`:

1. **Check each column**: Is it modified, dropped, or renamed?
2. **Share unchanged**: If column unchanged, store reference to original array
3. **Copy changed**: If column modified, use the new array from `updates`
4. **Add new**: New columns added from `updates`
5. **Result**: New DataFrame shares most columns, only changed ones are copied

### Example

```typescript
const df1 = createDataFrame([...]);  // 10 columns, 1M rows
const df2 = df1.mutate({ newCol: ... });  // Only 1 column copied, 9 shared
```

**Memory**: Instead of copying 10M values, we copy 1M values (90% savings)

## Memory Behavior

| Goal | Reality |
|------|---------|
| **Reduce total memory** | ✅ Achieved - shared columns mean less total memory used |
| **Early garbage collection** | ❌ Not achieved - shared columns can't be GC'd until all DataFrames using them are GC'd |
| **Memory profiler clarity** | ❌ Not achieved - profilers show shared references, making memory usage look higher than it is |

## When COW Is Used

| Operation | Uses COW? | Why |
|-----------|-----------|-----|
| `mutate()` | ✅ Yes | Values change, structure same |
| `select()` | ✅ Yes | Columns selected, but shared |
| `rename()` | ✅ Yes | Only metadata changes |
| `filter()` | ❌ No | Row count changes, need new store |
| `arrange()` | ❌ No | Uses view system instead |
| `join()` | ❌ No | Completely different structure |

## Trade-offs

**What we get:**
- Massive memory savings (often 80-90% reduction)
- Fast operations (reference assignment vs copying)
- Works automatically

**What we trade:**
- Shared columns delay garbage collection
- Can't modify columns in place (must copy to modify)
- Memory profilers show confusing results (shared references)
