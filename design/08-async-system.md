# Async System (PromisedDataFrame)

## Design Goals and Implementation

| Design Goal | Implementation |
|------------|----------------|
| **Mix async and sync operations seamlessly** | `PromisedDataFrame` implements `PromiseLike` and DataFrame API. You can chain async and sync operations without thinking about it. |
| **No explicit Promise handling** | Don't need to wrap things in `Promise.all()` or handle promises manually. Just chain operations normally. |
| **Type-safe async chains** | TypeScript knows when you need to `await`. Types flow through async operations correctly. |
| **Works with existing API** | All DataFrame methods work on `PromisedDataFrame`. No special async versions needed. |

## Problem Solved

| Problem | Solution |
|---------|----------|
| **TypeScript overload resolution fails** | Override method signatures in `PromisedDataFrame` type definition. TypeScript sees correct types even though proxy handles routing at runtime. |
| **Proxy bypasses normal overloads** | Type-level overrides work where runtime overloads fail. TypeScript sees overridden signatures during compilation. |

## How It Works

When you do `df.mutate({ data: async (row) => await fetch(row.id) })`:

1. **Detect async**: Function returns Promise
2. **Wrap result**: Return `PromisedDataFrame` wrapper
3. **Chain operations**: Next operations work on wrapper
4. **Await when needed**: `await` converts back to `DataFrame`

## Usage Example

```typescript
const result = await df
  .mutate({ data: async (row) => await fetch(row.id) })  // Returns PromisedDataFrame
  .filter(row => row.data.active)                         // Works on PromisedDataFrame
  .summarize({ count: g => g.nrows() });                 // Still PromisedDataFrame
// After await, result is DataFrame with correct types
```

## Benefits

- **Seamless**: Mix async/sync without thinking
- **Type-safe**: TypeScript guides you correctly
- **Familiar**: Same API, just works with async
- **No boilerplate**: No manual Promise handling needed
