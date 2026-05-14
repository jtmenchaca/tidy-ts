# Telemetry System

## Design Goals and Implementation

| Design Goal | Implementation |
|------------|----------------|
| **Zero overhead when disabled** | Tracing only runs if `trace: true` option set. No performance impact for normal usage. |
| **Automatic cleanup** | Use `WeakMap` to store trace contexts. When DataFrame is garbage collected, trace data is automatically cleaned up. |
| **See operation timing** | Each operation creates a span with timing. See how long each operation takes. |
| **Understand operation hierarchy** | Spans nest naturally. See that `filter` happened inside `mutate`, for example. |
| **Automatic metadata** | Infers rows, columns, groups from DataFrame state. Don't need to manually add metadata. |
| **Follow operations through chains** | Trace context copied to new DataFrames. See full chain of operations. |

## Usage

```typescript
const df = createDataFrame(data, { trace: true });
// ... operations ...
df.printTrace();  // Pretty-print trace tree
```

## Features

| Feature | Implementation |
|---------|----------------|
| **Hierarchical spans** | Operations nest naturally. Child spans show up under parent spans. |
| **Metadata extraction** | Automatically extracts row count, column names, group count from DataFrame. |
| **Context flow** | Trace follows DataFrames through method chains. See full operation history. |
| **Memory efficient** | WeakMap auto-cleans. No memory leaks from tracing. |

## Benefits

- **Zero cost**: No performance impact when disabled
- **Automatic**: No manual instrumentation needed
- **Helpful**: See exactly where time is spent
- **Clean**: Auto-cleans, no memory leaks
