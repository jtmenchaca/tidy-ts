# Tidy-TS API Documentation

> Auto-generated from tidy-ts MCP documentation

## Packages

- **[@tidy-ts/dataframe](https://jsr.io/@tidy-ts/dataframe)** - Core DataFrame library
- **[@tidy-ts/shims](https://jsr.io/@tidy-ts/shims)** - Cross-runtime compatibility
- **[@tidy-ts/ai](https://jsr.io/@tidy-ts/ai)** - AI/LLM utilities
- **[@tidy-ts/parquet](https://jsr.io/@tidy-ts/parquet)** - Parquet file I/O
- **[@tidy-ts/arrow](https://jsr.io/@tidy-ts/arrow)** - Arrow IPC file I/O

## API Reference

- [DataFrame Operations](./api/dataframe.md) (46 functions)
- [Statistics Functions](./api/stats.md) (37 functions)
- [I/O Operations](./api/io.md) (11 functions)
- [LLM Utilities](./api/llm.md) (3 functions)
- [Cross-Runtime Compatibility (Shims)](./api/shims.md) (72 functions)

## Quick Start

```typescript
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const df = createDataFrame([
  { name: "Alice", age: 30, score: 85 },
  { name: "Bob", age: 25, score: 92 },
  { name: "Charlie", age: 35, score: 78 },
]);

// Analyze data
const result = df
  .filter((r) => r.age > 25)
  .mutate({ grade: (r) => r.score >= 90 ? 'A' : 'B' })
  .arrange("score", "desc");

result.print("Analysis Results");
```
