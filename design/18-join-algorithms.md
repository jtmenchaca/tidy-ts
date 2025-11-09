# Join Algorithms

## Design Goals and Implementation

| Design Goal | Implementation |
|------------|----------------|
| **Fast joins for all dataset sizes** | Adaptive strategy: WASM for small datasets (< 1000 rows), pure JS hash joins for large datasets (≥ 1000 rows). |
| **Handle multiple join keys** | Composite keys via null-separated string concatenation. Multi-key joins work efficiently. |
| **Support all join types** | Inner, left, right, outer, cross, and asof joins. Each optimized for its use case. |
| **Preserve left order** | Left join maintains order of left DataFrame. Important for predictable results. |

## Strategy Selection

| Dataset Size | Algorithm | Why |
|--------------|-----------|-----|
| **Small** (< 1000 rows) | WASM join functions | WASM overhead acceptable, fast execution |
| **Large** (≥ 1000 rows) | Pure JS hash joins | WASM marshaling overhead exceeds benefit |

## Algorithms

| Algorithm | How It Works |
|-----------|--------------|
| **Hash Join** | Build hash map on right table, probe with left. O(N+M) average case. |
| **Multi-key** | Concatenate key values with null separator, use as single key. Handles multiple columns efficiently. |
| **Index mapping** | Map logical indices through views. Respects filters and sorts on input DataFrames. |

## Join Types

| Type | Behavior |
|------|----------|
| **Inner** | Only matching rows from both sides |
| **Left** | All left rows, matching right rows (or null) |
| **Right** | All right rows, matching left rows (or null) |
| **Outer** | All rows from both sides |
| **Cross** | Cartesian product |
| **Asof** | Temporal matching (nearest match by time) |

## Parallel Joins

| Goal | Status |
|------|--------|
| **Hash partition both sides** | ✅ Implemented - partitions by key hash |
| **Workers process partitions** | ❌ Disabled - worker functionality removed |
| **Merge results** | ✅ Implemented - k-way merge maintaining order |

## Benefits

- **Adaptive**: Chooses best algorithm for dataset size
- **Fast**: Hash joins are efficient
- **Flexible**: Supports all common join types
- **Correct**: Preserves order and handles edge cases
