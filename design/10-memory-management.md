# Memory Management

## Design Goals and Implementation

| Design Goal | Implementation |
|------------|----------------|
| **Reduce total memory usage** | Copy-on-write shares unmodified columns. Views defer data copying. Both reduce total memory significantly. |
| **Don't copy data unnecessarily** | Views avoid copying for filters/sorts. COW avoids copying unchanged columns. Only copy when actually needed. |
| **Handle large datasets** | Columnar storage + COW + views work together to handle datasets larger than RAM efficiently. |
| **Automatic memory management** | WeakMap for telemetry auto-cleans. Shared columns GC'd when all DataFrames are GC'd. No manual cleanup needed. |

## Copy-on-Write Impact

| Goal | Reality |
|------|---------|
| **Reduce total memory** | ✅ Achieved - shared columns mean less total memory |
| **Early garbage collection** | ❌ Not achieved - shared columns delay GC until all DataFrames GC'd |
| **Memory profiler clarity** | ❌ Not achieved - profilers show shared references, looks like more memory than actually used |

## View System Impact

| Goal | Reality |
|------|---------|
| **Avoid data copy for filters** | ✅ Achieved - only BitSet created, no data copy |
| **Avoid data copy for sorts** | ✅ Achieved - only index array created, no data copy |
| **Defer expensive work** | ✅ Achieved - materialization only when accessing data |

## GC Behavior

| Pattern | Memory Impact |
|---------|---------------|
| **Reassignment** (`df = df.mutate(...)`) | Old DataFrame object GC'd immediately, but shared columns remain until new DataFrame GC'd |
| **Separate variables** (`const df2 = df1.mutate(...)`) | Same as reassignment - shared columns prevent early GC |
| **Chained operations** | Maximizes COW benefits - intermediate DataFrames share columns |

## Best Practices

- **Chain operations**: Maximizes COW benefits, reduces intermediate objects
- **Materialize views only when needed**: Don't call `toArray()` unless you need it
- **Understand shared columns**: They delay GC but reduce total memory (this is expected and good)
