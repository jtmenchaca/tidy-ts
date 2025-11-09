# Architecture Overview

## Design Principles

1. **Columnar Storage**: Column-major format for cache efficiency and vectorization
2. **Copy-on-Write**: Share unmodified columns between DataFrames
3. **Lazy Views**: Defer filtering/sorting until materialization
4. **Type Safety**: Full TypeScript inference through all operations
5. **Immutability**: All operations return new DataFrames

## Component Stack

```
API Layer (Proxy) → Verb Resolution → Storage/Views → Implementation
```

## Key Components

- **ColumnarStore**: `{ columns: Record<string, unknown[]>, length, columnNames }`
- **View**: Lazy index/mask for filtering/sorting
- **COW**: Share unmodified columns, copy only changed ones
- **Proxy**: Intercept property access for column access and method routing
- **Verbs**: Curried functions `verb(spec)(df)` for composability

## Data Flow

```typescript
createDataFrame([...])  // Rows → Columnar storage
  .filter(...)          // View with mask (no copy)
  .mutate(...)          // COW: new column, share others
  .groupBy(...)         // Adjacency list grouping
  .summarize(...)       // Materialize view, process groups
```
