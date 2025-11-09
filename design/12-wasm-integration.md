# WASM Integration

## Design Goals and Implementation

| Design Goal | Implementation |
|------------|----------------|
| **Fast performance-critical operations** | Use Rust compiled to WebAssembly. Near-native speed for heavy operations like joins, sorting, grouping. |
| **Works in browser and Node.js** | WASM is portable. Same code works everywhere JavaScript runs. |
| **Preserve type safety** | TypeScript bindings maintain types through WASM boundary. Types flow correctly. |
| **Lazy loading** | WASM module loaded on first use, not upfront. No performance cost if you don't use WASM operations. |

## Architecture

```
Rust (Core) → WASM → TypeScript Bindings → DataFrame API
```

## Operations in WASM

| Operation | Why WASM |
|-----------|----------|
| **Joins** | Hash joins and merge joins are compute-intensive. WASM provides near-native speed. |
| **Sorting** | Fast arrange operations for large datasets. |
| **Grouping** | Efficient group building and adjacency list operations. |
| **Pivots** | Pivot longer/wider operations benefit from WASM speed. |
| **Stats** | Statistical functions and tests (especially GLM) are compute-heavy. |

## Binding Pattern

| Goal | Implementation |
|------|----------------|
| **Seamless integration** | TypeScript functions wrap WASM calls. Serialize DataFrame data, call WASM, deserialize results. |
| **Type preservation** | Types flow through serialization boundary. Result DataFrames have correct types. |

## Benefits

- **Performance**: Near-native speed for heavy operations
- **Portability**: Works everywhere JavaScript runs
- **Type safety**: Types preserved through WASM boundary
- **Lazy loading**: No cost if not used
