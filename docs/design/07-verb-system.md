# Verb System

## Design Goals and Implementation

| Design Goal | Implementation |
|------------|----------------|
| **Consistent API pattern** | All verbs follow same pattern: `verb(spec)(df)`. Makes API predictable and easy to learn. |
| **Easy to test** | Verbs are pure functions - same input always gives same output. No side effects, easy to unit test. |
| **Composable operations** | Verbs can be combined: `mutate(spec1)(mutate(spec2)(df))`. Enables powerful operation chaining. |
| **Easy to add new verbs** | Just create new verb function following the pattern, add to `resolveVerb()`. Consistent structure makes extension simple. |
| **Method names map to verbs** | `df.mutate()` calls `mutate()` verb. Proxy routes method names to verb functions automatically. |

## Verb Pattern

```typescript
export function mutate<Row>(spec: MutateSpec) {
  return (df: DataFrame<Row>) => {
    // Implementation
    return newDataFrame;
  };
}
```

## Verb Categories

| Category | Examples | Purpose |
|----------|----------|---------|
| **Transformation** | mutate, rename, reorder | Change values or structure |
| **Filtering** | filter, distinct, slice | Remove or select rows |
| **Selection** | select, drop, extract | Choose columns |
| **Aggregation** | summarize, count | Compute group statistics |
| **Joins** | leftJoin, innerJoin | Combine DataFrames |
| **Reshape** | pivot, transpose | Change data shape |

## Resolution Flow

When you call `df.mutate(...)`:

1. **Proxy intercepts**: `resolveVerb("mutate", df)` called
2. **Find verb**: Looks up `mutate` function
3. **Return wrapper**: Function that calls `mutate(spec)(df)`
4. **Execute**: Verb runs and returns new DataFrame

## Benefits

- **Consistent**: Same pattern everywhere
- **Testable**: Pure functions easy to test
- **Composable**: Verbs work together seamlessly
- **Extensible**: Easy to add new operations
