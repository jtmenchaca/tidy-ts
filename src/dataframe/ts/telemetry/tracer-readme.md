# DataFrame Tracing Architecture

## Overview

The tracing system provides zero-overhead performance profiling for DataFrame operations. When enabled, it captures detailed timing information for all operations and sub-operations, creating a hierarchical trace that flows through chained method calls.

## Architecture

### Core Components

1. **Tracer (Singleton)**: Central tracing manager that maintains contexts for all DataFrames
2. **TraceContext**: Per-DataFrame state containing enabled flag and span tree
3. **Span**: Individual operation timing with metadata and child spans
4. **WeakMap Storage**: Memory-efficient context storage that auto-cleans when DataFrames are garbage collected

### Design Principles

- **Zero overhead when disabled**: No performance impact without `trace: true`
- **Automatic metadata extraction**: Smart inference of rows, columns, groups from DataFrame state
- **Hierarchical span trees**: Operations nest naturally (e.g., filter within mutate)
- **Context flow**: Trace state follows DataFrames through method chains
- **Clean API**: Minimal code needed to instrument new operations

## Usage

### Enable Tracing

```typescript
const df = createDataFrame(data, { trace: true });
```

### View Traces

```typescript
// After operations
df.printTrace();  // Pretty-print to console
df.getTrace();    // Get raw span data
```

### Example Output

```
📊 DataFrame Operation Trace:
├─ mutate: 0.742ms (rows=1000, grouped=false, columns=doubled,isHigh)
  ├─ prepare-columns: 0.029ms
  ├─ process-ungrouped-mutations: 0.484ms
  ├─ handle-drops: 0.024ms (dropCount=0)
  ├─ create-updated-dataframe: 0.134ms
  ├─ filter: 1.350ms (rows=1000, grouped=false, predicates=1)
    ├─ compute-filter-mask: 1.204ms
    ├─ combine-masks: 0.040ms
    ├─ create-filtered-dataframe: 0.080ms

Total time: 0.742ms
```

## Implementation Guide

### Instrumenting a New Verb

```typescript
export function myVerbImpl<Row>(df: DataFrame<Row>, spec: any) {
  // 1. Start span with automatic metadata extraction
  const span = tracer.startSpan(df, "myVerb", spec);

  try {
    // 2. Wrap sub-operations with spans
    const result = tracer.withSpan(df, "sub-operation", () => {
      // Your logic here
      return computeSomething();
    });

    // 3. Create output DataFrame
    const outputDf = createDataFrame(result);
    
    // 4. Copy trace context to output
    tracer.copyContext(df, outputDf);
    
    return outputDf;
  } finally {
    // 5. Always close the span
    tracer.endSpan(df, span);
  }
}
```

### Minimal API

```typescript
// Start tracing with smart metadata extraction
const span = tracer.startSpan(df, "operation", spec);

// Execute function within a span (auto-traced)
tracer.withSpan(df, "step-name", () => { /* logic */ });

// Copy context when creating new DataFrames
tracer.copyContext(sourceDF, targetDF);

// End the span
tracer.endSpan(df, span);
```

## Technical Details

### Memory Management

- Uses WeakMap to store contexts → automatic cleanup
- Contexts removed when DataFrames are garbage collected
- No memory leaks from long-running processes

### Performance Characteristics

- Span creation: ~0.001ms overhead
- Metadata extraction: ~0.002ms
- Total overhead when enabled: <1% for most operations
- Zero overhead when disabled (early return checks)

### Metadata Extraction

Automatically captured for each operation:
- `rows`: Number of rows in DataFrame
- `grouped`: Whether DataFrame is grouped
- `columns`: Column names from operation spec
- `groupCount`: Number of groups (if grouped)
- Custom metadata via span options

### Context Propagation

1. Initial DataFrame gets context via `trace: true` option
2. Operations check for existing context or create new one
3. Result DataFrames receive copied context
4. Chained operations append to existing span tree

## Advanced Features

### Custom Metadata

```typescript
tracer.withSpan(df, "custom-op", () => {
  // operation
}, { customField: "value", itemCount: 42 });
```

### Conditional Tracing

```typescript
// Only traces if already enabled on DataFrame
tracer.withSpan(df, "expensive-op", () => {
  // This won't create overhead if tracing is disabled
});
```

### Manual Span Management

```typescript
// For complex async operations
const span = tracer._startSpan(df, "async-op", { async: true });
try {
  await someAsyncWork();
} finally {
  tracer.endSpan(df, span);
}
```

## Best Practices

1. **Always use try/finally**: Ensure spans close even on errors
2. **Keep span names consistent**: Use kebab-case verb names
3. **Add meaningful metadata**: Include operation-specific context
4. **Trace expensive operations**: Focus on operations that could be bottlenecks
5. **Copy context religiously**: Every new DataFrame should inherit trace state

## Future Enhancements

- Export to OpenTelemetry format
- Flame graph visualization
- Performance regression detection
- Automatic bottleneck identification
- Trace sampling for production use