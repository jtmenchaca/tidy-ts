# Chain Architecture Documentation

## Overview

The tidy-ts library implements a fluent, chainable API that allows seamless composition of data transformations. The core challenge is supporting both synchronous and asynchronous operations while maintaining a consistent chaining interface. This document explains how the chaining infrastructure works in excruciating detail.

## Core Components

### 1. DataFrame and GroupedDataFrame

These are the core data structures that represent tabular data:

```typescript
interface DataFrame<Row> {
  nrows(): number;
  columns(): string[];
  toArray(): Row[];
  // ... other methods
}

interface GroupedDataFrame<Row, GroupName> extends DataFrame<Row> {
  __groups: GroupInfo;
  // ... group-specific methods
}
```

### 2. ThenableDataFrame - The Chainable Wrapper

The `thenableDataFrame` is a Proxy that wraps either a `DataFrame` or a `Promise<DataFrame>`, making it chainable and Promise-like:

```typescript
function thenableDataFrame<Row>(
  dfOrPromise: DataFrame<Row> | Promise<DataFrame<Row>>
): ChainableDataFrame<Row>
```

**Key Properties:**
- **Promise Interface**: Exposes `then`, `catch`, `finally` methods
- **Fluent Methods**: All DataFrame verbs (mutate, filter, select, etc.)
- **Sync Methods**: Direct access to `nrows`, `toArray`, `columns`
- **Column Access**: `df['columnName']` for column data
- **Row Access**: `df[0]` for row data (after await)
- **Internal Marker**: `Symbol.for("__thenableDataFrame")` for detection

### 3. Method Resolution System

The `resolveVerb` function maps method names to their implementations:

```typescript
export function resolveVerb(prop: PropertyKey, df: unknown) {
  if (prop === "mutate") {
    return (spec: object) => {
      const result = (mutate as any)(spec)(df);
      return result instanceof Promise ? thenableDataFrame(result) : result;
    };
  }
  if (prop === "filter") {
    return (...a: unknown[]) => {
      const result = (filter as any)(...a)(df);
      return result instanceof Promise ? thenableDataFrame(result) : result;
    };
  }
  // ... other verbs
}
```

### 4. Async/Sync Detection

The system automatically detects whether operations should be async or sync:

```typescript
function isAsyncFunction(fn: unknown, testArgs: unknown[] = []): boolean {
  if (typeof fn !== "function") return false;
  
  // Check if declared async
  if (fn instanceof AsyncFunction) return true;
  
  // Test if it returns a Promise
  try {
    const result = (fn as any)(...testArgs);
    return returnsPromise(result);
  } catch (error) {
    return true; // Assume async if function throws
  }
}
```

## Chaining Flow Examples

### Example 1: Simple Sync Chain

```typescript
const result = df
  .filter(row => row.age > 18)
  .mutate({ adult: true })
  .select('name', 'adult');
```

**Flow:**
1. `df.filter(...)` → `resolveVerb('filter', df)` → returns function
2. Function called with predicate → `filterRowsSync(df, predicates)` → returns DataFrame
3. `df.mutate(...)` → `resolveVerb('mutate', df)` → returns function  
4. Function called with spec → `mutateSyncImpl(df, spec)` → returns DataFrame
5. `df.select(...)` → `resolveVerb('select', df)` → returns function
6. Function called with columns → `selectRows(df, columns)` → returns DataFrame

**No thenableDataFrame wrappers needed** - all operations are sync and return plain DataFrames.

### Example 2: Mixed Sync/Async Chain

```typescript
const result = await df
  .mutate({
    sync_col: (row) => row.value * 2,
    async_col: async (row) => await fetchData(row.id)
  })
  .filter(async (row) => await validate(row))
  .select('name', 'sync_col', 'async_col');
```

**Flow:**
1. `df.mutate(...)` → `shouldUseAsyncForMutate(df, spec)` → `true` (has async functions)
2. Returns `mutateAsyncImpl(df, spec)` → returns `Promise<DataFrame>`
3. `resolveVerb('mutate', df)` wraps result: `thenableDataFrame(promise)`
4. **Chain continues on thenableDataFrame proxy**
5. `.filter(...)` → proxy's `get` trap → `handleMethodForwarding('filter', promise, ...)`
6. Returns function that when called:
   - Awaits the promise to get the resolved DataFrame
   - Calls `resolveVerb('filter', resolvedDf)` 
   - Returns `filterRowsAsync(resolvedDf, predicates)` → `Promise<DataFrame>`
   - Wraps result: `thenableDataFrame(promise)`
7. **Chain continues on new thenableDataFrame proxy**
8. `.select(...)` → proxy's `get` trap → `handleMethodForwarding('select', promise, ...)`
9. Returns function that when called:
   - Awaits the promise to get the resolved DataFrame
   - Calls `resolveVerb('select', resolvedDf)`
   - Returns `selectRows(resolvedDf, columns)` → `DataFrame`
   - Wraps result: `thenableDataFrame(dataFrame)`
10. **Final await** resolves the chain to a plain DataFrame

### Example 3: Complex Nested Chain

```typescript
const result = await people
  .groupBy('species')
  .mutate({
    avg_mass: (row, idx, df) => {
      // This runs in grouped context
      return df.select('mass').toArray().reduce((sum, r) => sum + r.mass, 0) / df.nrows();
    },
    async_category: async (row) => {
      await new Promise(resolve => setTimeout(resolve, 1));
      return row.mass > 100 ? 'heavy' : 'light';
    }
  })
  .filter(async (row) => {
    await new Promise(resolve => setTimeout(resolve, 1));
    return row.async_category === 'heavy';
  })
  .ungroup()
  .arrange('avg_mass')
  .select('name', 'species', 'mass', 'avg_mass', 'async_category');
```

**Flow:**
1. `people.groupBy('species')` → returns `GroupedDataFrame`
2. `.mutate(...)` on GroupedDataFrame → `shouldUseAsyncForMutate` → `true`
3. Returns `mutateAsyncImpl(groupedDf, spec)` → `Promise<GroupedDataFrame>`
4. Wrapped in `thenableGroupedDataFrame(promise)`
5. **Chain continues on grouped thenable proxy**
6. `.filter(...)` → proxy forwards to `resolveVerb('filter', groupedDf)`
7. Returns `filterRowsAsync(groupedDf, predicates)` → `Promise<GroupedDataFrame>`
8. Wrapped in `thenableGroupedDataFrame(promise)`
9. **Chain continues on grouped thenable proxy**
10. `.ungroup()` → proxy forwards to `resolveVerb('ungroup', groupedDf)`
11. Returns `ungroup(groupedDf)` → `DataFrame`
12. Wrapped in `thenableDataFrame(dataFrame)`
13. **Chain continues on regular thenable proxy**
14. `.arrange(...)` → sync operation → returns `DataFrame`
15. Wrapped in `thenableDataFrame(dataFrame)`
16. **Chain continues on thenable proxy**
17. `.select(...)` → sync operation → returns `DataFrame`
18. **Final await** resolves to plain DataFrame

## Proxy Implementation Details

### The `get` Trap

```typescript
const proxy = new Proxy({}, {
  get(_t, prop, _r) {
    // Special marker for detection
    if (prop === Symbol.for("__thenableDataFrame")) {
      return true;
    }

    // Promise interface
    if (prop === "then") return p.then.bind(p);
    if (prop === "catch") return p.catch.bind(p);
    if (prop === "finally") return p.finally.bind(p);

    // Handle different property types
    const numericHandler = createNumericIndexHandler<DataFrame<Row>>();
    const numericResult = numericHandler(prop, dfOrPromise, p);
    if (numericResult !== null) return numericResult;

    const symbolHandler = createSymbolPropertyHandler<DataFrame<Row>>();
    const symbolResult = symbolHandler(prop, dfOrPromise, p);
    if (symbolResult !== null) return symbolResult;

    const syncHandler = createSyncMethodsHandler<DataFrame<Row>>(syncMethods);
    const syncResult = syncHandler(prop, dfOrPromise, p);
    if (syncResult !== null) return syncResult;

    const columnHandler = createColumnAccessHandler<DataFrame<Row>>(
      (df) => (df as any).columns?.()
    );
    const columnResult = columnHandler(prop, dfOrPromise, p);
    if (columnResult !== null) return columnResult;

    const printHandler = createPrintMethodHandler<DataFrame<Row>>(thenableDataFrame);
    const printResult = printHandler(prop, dfOrPromise, p);
    if (printResult !== null) return printResult;

    // Method forwarding for fluent verbs
    if (isSync) {
      // Direct method call for sync operations
      const df = dfOrPromise as DataFrame<Row>;
      const method = resolveVerb(prop, df);
      if (typeof method === "function") {
        return ((...args: unknown[]) => {
          const result = (method as any)(...args);
          if (isDataFrame(result)) {
            return thenableDataFrame(result);
          } else if (isGroupedDataFrame(result)) {
            return thenableGroupedDataFrame(result);
          }
          return result;
        }) as any;
      }
    } else {
      // Method forwarding for async operations
      return handleMethodForwarding(
        prop,
        p,
        resolveVerb,
        isDataFrame,
        isGroupedDataFrame,
        thenableDataFrame,
        thenableGroupedDataFrame,
      );
    }
  }
});
```

### Method Forwarding Handler

The `handleMethodForwarding` function is crucial for async operations:

```typescript
export function handleMethodForwarding<Row>(
  prop: string | number | symbol,
  p: Promise<DataFrame<Row>>,
  resolveVerb: (prop: string | number | symbol, df: DataFrame<Row>) => any,
  isDataFrame: (x: unknown) => x is DataFrame<Row>,
  isGroupedDataFrame: (x: unknown) => x is GroupedDataFrame<Row, keyof Row>,
  chainFn: (df: DataFrame<Row> | Promise<DataFrame<Row>>) => any,
  chainGroupedFn: (gdf: GroupedDataFrame<Row, keyof Row>) => any,
) {
  return ((...args: unknown[]) => {
    const promiseOut = p.then((df) => {
      const method = resolveVerb(prop, df);
      
      if (typeof method !== "function") {
        // Try direct property access
        const directProp = (df as any)[prop];
        if (directProp !== undefined) {
          if (typeof directProp === "function") {
            return directProp.bind(df)(...args);
          }
          return directProp;
        }
        throw createPropertyError(prop, "DataFrame");
      }

      const out = (method as any)(...args);
      
      // Check if already wrapped
      if (isThenableDataFrame(out)) {
        return out;
      }

      return out;
    });

    // Always wrap the promise result in a thenable for chaining
    return wrapThenable<Row>(
      promiseOut as Promise<unknown>,
      chainFn as unknown as (df: DataFrame<Row>) => any,
      chainGroupedFn as unknown as (gdf: GroupedDataFrame<Row, keyof Row>) => any,
    );
  }) as any;
}
```

## Error Handling

### Property Access Errors

```typescript
function createPropertyError(
  prop: string | number | symbol,
  type: string,
): Error {
  return new Error(
    `Property '${String(prop)}' is not callable before await; await the ${type} first.`
  );
}
```

### Async Function Detection Errors

If async function detection fails, the system assumes the function might be async to be safe:

```typescript
try {
  const result = (fn as any)(...testArgs);
  return returnsPromise(result);
} catch (error) {
  // If function throws during testing, assume it might be async
  return true;
}
```

## Performance Considerations

### 1. Proxy Overhead

Each thenableDataFrame is a Proxy, which has some overhead. However, this is necessary for the fluent API.

### 2. Promise Wrapping

Every async operation creates a new Promise and wraps it in a thenableDataFrame. This is unavoidable for proper chaining.

### 3. Method Resolution

The `resolveVerb` function is called for every method access. This is cached by the JavaScript engine in most cases.

### 4. Async Detection

Async function detection involves calling the function with test arguments. This is done once per verb call, not per row.

## Debugging

### Debug Logs

The system includes extensive debug logging:

```typescript
console.log("🔍 thenableDataFrame: creating wrapper for:", typeof dfOrPromise);
console.log("🔍 chain proxy get: prop:", String(prop));
console.log("🔍 handleMethodForwarding: called with prop:", String(prop));
```

### Common Issues

1. **"Property 'select' is not a function"**
   - Usually means the object is not a thenableDataFrame
   - Check if `Symbol.for("__thenableDataFrame") in obj`

2. **Async functions not detected**
   - Check if `isAsyncFunction` is working correctly
   - Verify test arguments are appropriate

3. **Chaining breaks after async operation**
   - Ensure `handleMethodForwarding` wraps results in thenableDataFrame
   - Check that `wrapThenable` is called correctly

## Testing

### Unit Tests

```typescript
Deno.test("async mutate with chaining", async () => {
  const result = await df
    .mutate({ async_col: async (r) => await fetchData(r.id) })
    .filter(async (r) => await validate(r))
    .select('name', 'async_col');
    
  expect(result.toArray()).toEqual(expectedData);
});
```

### Integration Tests

```typescript
Deno.test("complex chaining workflow", async () => {
  const result = await people
    .groupBy('species')
    .mutate({ avg_mass: (r, i, df) => calculateAverage(df) })
    .filter(r => r.avg_mass > 50)
    .ungroup()
    .arrange('avg_mass')
    .select('name', 'species', 'avg_mass');
    
  expect(result.nrows()).toBe(3);
});
```

## Future Improvements

### 1. Lazy Evaluation

Could implement lazy evaluation for better performance with large datasets.

### 2. Streaming

Could add streaming support for very large datasets.

### 3. Parallel Processing

Could add parallel processing for independent operations.

### 4. Caching

Could add caching for expensive operations.

## Conclusion

The chaining architecture in tidy-ts provides a powerful, fluent API that seamlessly handles both synchronous and asynchronous operations. The key insight is using Proxy objects to intercept method calls and automatically wrap results in chainable wrappers, ensuring that the fluent interface works regardless of whether operations are sync or async.

The system is designed to be robust, with extensive error handling and debugging capabilities, while maintaining good performance characteristics for typical data analysis workflows.
