# WASM Data Transfer Best Practices: distinct ↔ left-join

## Core Data Flow Pattern

### TypeScript → WASM (Input)
```typescript
// Both distinct and left-join follow this pattern
const typedArrays = convertToTypedArrays(store.columns, keyCols);
const columnData = keyCols.map((colName) => typedArrays[colName]);
const wasmResult = wasmFunction(columnData, additionalParams);
```

### WASM Function Signatures
```rust
// distinct.wasm.rs
#[wasm_bindgen]
pub fn distinct_rows_generic_typed(column_data: Vec<Uint32Array>, view_index: &[u32]) -> Vec<u32>

// left-join.wasm.rs  
#[wasm_bindgen]
pub fn left_join_typed_multi_u32(left_columns: Vec<Uint32Array>, right_columns: Vec<Uint32Array>) -> JoinIdxU32
```

### WASM → TypeScript (Output)
```typescript
// distinct: Simple array conversion
const result = Array.from(wasmResult);

// left-join: Extract typed arrays directly (no Array.from)
const leftIdxTA = wasmResult.takeLeft() as Uint32Array;
const rightIdxTA = wasmResult.takeRight() as Uint32Array;
```

## Type Encoding (TypeScript)

```typescript
// convertToTypedArrays() handles JS → Uint32Array conversion
// Preserves original data types while enabling WASM processing
const typedArrays = convertToTypedArrays(store.columns, keyCols);
```

## Hash Logic Patterns

### Distinct (Simple Hash Table)
```rust
// distinct.wasm.rs - Simple uniqueness checking
for &physical_idx in view_index.iter() {
    let mut key_values = Vec::with_capacity(column_data.len());
    for array in &column_data {
        key_values.push(array.get_index(physical_idx));
    }
    match hash_tbl.entry(key_values) {
        hashbrown::hash_map::Entry::Vacant(entry) => {
            entry.insert(());
            result_indices.push(physical_idx);
        }
        hashbrown::hash_map::Entry::Occupied(_) => {
            // Duplicate found - skip
        }
    }
}
```

### Left-Join (CSR Index + Specialized Kernels)
```rust
// left-join.wasm.rs - Advanced join algorithms
// 1-column: build_csr_u32() + direct lookup
// 2-column: build_csr_u64_packed() + packed keys  
// Multi-column: hash_row_multi() + collision resolution
let (map, adj) = build_csr_u32(right_keys);
// ... efficient join probing with CSR index
```

## Advanced Optimizations

### Bulk Data Transfer
```rust
// left-join.wasm.rs - Minimize JS↔WASM copies
fn bulk_copy_u32(cols: &[Uint32Array]) -> Vec<Vec<u32>> {
    cols.iter().map(|c| {
        let mut v = vec![0u32; c.length() as usize];
        c.copy_to(&mut v);
        v
    }).collect()
}
```

### Specialized Kernels
```rust
// Different algorithms for different column counts
match num_cols {
    1 => left_join_1col(&left[0], &right[0]),
    2 => left_join_2col(&left[0], &left[1], &right[0], &right[1]),
    _ => left_join_multi(&left, &right),
}
```

### Null Handling
```rust
// left-join uses sentinel values for missing matches
const SENTINEL: u32 = u32::MAX; // 0xFFFFFFFF
// TypeScript checks: (r === RIGHT_NULL) ? undefined : src[r]
```

## Key Patterns

1. **Pre-encode to u32**: JS values → `Uint32Array` before WASM boundary
2. **Pass typed arrays**: `Vec<Uint32Array>` not `Vec<JsValue>`
3. **Return indices**: WASM returns indices, not reconstructed data
4. **Single boundary crossing**: One WASM call handles entire operation
5. **Avoid Array.from()**: Use typed arrays directly when possible
6. **Bulk operations**: Minimize individual element access across boundary
7. **Specialized algorithms**: Different kernels for different data patterns
8. **Fallback strategy**: JS implementation using same typed array patterns