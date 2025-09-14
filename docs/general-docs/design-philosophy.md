# tidy-ts Design Philosophy

## Overview

tidy-ts is a TypeScript-first data manipulation library that combines the expressiveness of tidy data principles with the performance of modern systems programming. It represents a thoughtful evolution of data analysis tools, designed for developers who value type safety, performance, and intuitive APIs.

## Core Design Principles

### 1. **TypeScript-First Design**
- **Native TypeScript**: Built from the ground up for TypeScript, not retrofitted from JavaScript
- **Type Inference**: Leverages TypeScript's type system to provide compile-time guarantees
- **Generic Types**: Uses sophisticated generic types to maintain type safety across transformations
- **IntelliSense**: Full IDE support with autocomplete and type checking

### 2. **Tidy Data Philosophy**
- **Consistent Structure**: Each observation forms a row, each variable forms a column
- **Immutable Operations**: All transformations return new DataFrames, preserving original data
- **Composable Verbs**: Operations chain naturally to build complex data pipelines
- **Predictable Results**: Same input always produces the same output, regardless of operation order

### 3. **Performance Through Architecture**
- **Columnar Storage**: Data stored in column-major format for cache efficiency
- **Lazy Views**: Transformations create views rather than copying data
- **WASM Integration**: Critical operations accelerated with Rust/WASM for large datasets
- **Copy-on-Write**: Efficient memory management with shared immutable data

### 4. **Developer Experience**
- **Progressive Complexity**: Examples start simple and build to complex workflows
- **Consistent API**: All operations follow the same patterns and naming conventions
- **Comprehensive Documentation**: Every feature demonstrated with runnable examples
- **Error Handling**: Clear error messages and graceful fallbacks

## Architectural Patterns

### **Columnar Storage System**
```typescript
interface ColumnarStore {
  columns: Record<string, unknown[]>;    // Column data as arrays
  length: number;                        // Number of rows
  columnNames: string[];                 // Column order
}
```

**Benefits:**
- **Cache Locality**: Related data stored together for better CPU cache performance
- **Vectorization**: Operations on entire columns can be vectorized
- **Memory Efficiency**: Avoids object overhead and enables WASM optimization
- **Type Safety**: Each column maintains its type information

### **View System for Lazy Evaluation**
```typescript
interface View {
  index?: Uint32Array | null;           // Row ordering/subset
  mask?: BitSet | null;                  // Keep/discard rows
  _materializedIndex?: Uint32Array;      // Cached resolved index
  _order?: ComparatorFunction;           // Sort function cache
}
```

**Benefits:**
- **Memory Efficiency**: Multiple views share the same underlying data
- **Composition**: Views can be layered (filter + sort + group)
- **Performance**: No data copying until materialization is required
- **Flexibility**: Complex transformations built from simple primitives

### **Two-Tier Performance Architecture**
- **Fast Path**: Optimized WASM operations for common cases (numeric data, ungrouped)
- **Stable Path**: Universal TypeScript implementation for complex scenarios
- **Automatic Fallback**: Seamless switching between paths based on data characteristics
- **Performance Profiling**: Built-in performance analysis and optimization guidance

## API Design Philosophy

### **Verb-Based Operations**
Every operation is a verb that clearly describes its purpose:
- `mutate()` - Add or transform columns
- `filter()` - Select rows based on conditions
- `group_by()` - Create grouping context
- `summarise()` - Aggregate within groups
- `arrange()` - Sort rows by columns

### **Fluent Interface**
Operations chain naturally to build complex pipelines:
```typescript
const result = data
  .filter(row => row.sales > 1000)
  .group_by("region")
  .summarise({
    total: group => stats.sum(group.sales),
    count: group => group.nrows()
  })
  .arrange({ by: "total", desc: true });
```

### **Consistent Parameter Patterns**
- **Object Specifications**: Complex operations use objects for clarity
- **Function Expressions**: Row-level operations use `(row, index, df) => value`
- **Group Expressions**: Group operations use `(group) => value`
- **Column References**: String names for columns, arrays for multiple columns

### **Type-Safe Transformations**
The type system automatically tracks changes:
```typescript
// Input type
DataFrame<{ id: number; name: string; sales: number }>

// After mutate
DataFrame<{ 
  id: number; 
  name: string; 
  sales: number; 
  sales_category: string;  // New column
  is_high_performer: boolean  // New column
}>
```

## Data Transformation Philosophy

### **Progressive Complexity**
Examples and operations build from simple to complex:
1. **Basic Operations**: Single column transformations
2. **Intermediate Patterns**: Multiple columns, conditional logic
3. **Advanced Workflows**: Complex pipelines with grouping and aggregation
4. **Real-world Scenarios**: End-to-end analysis workflows

### **Expression Flexibility**
Transformations support multiple expression types:
- **Simple Functions**: `(row) => row.value * 2`
- **Indexed Functions**: `(row, index) => index + 1`
- **DataFrame Context**: `(row, index, df) => stats.mean(df.value)`
- **Conditional Logic**: Complex if/else statements with early returns
- **Vector Operations**: Return arrays for vectorized results

### **String Operations**
Comprehensive text manipulation through the `str` module:
- **Pattern Detection**: `str.detect()` for regex matching
- **Extraction**: `str.extract()` and `str.extractAll()` for pattern capture
- **Replacement**: `str.replace()` and `str.replaceAll()` for text substitution
- **Splitting**: `str.split()` for tokenization
- **Properties**: `str.length()` for string analysis

### **Statistical Operations**
Rich statistical functions through the `stats` module:
- **Descriptive**: `mean()`, `median()`, `std()`, `min()`, `max()`
- **Ranking**: `rank()`, `percentile_rank()`
- **Cumulative**: `cumsum()`, `cummean()`
- **Aggregation**: `sum()`, `count()`, `unique()`
- **Utilities**: `round()`, `clamp()`, `isFinite()`

## Performance Philosophy

### **WASM Integration Strategy**
- **Selective Acceleration**: Only accelerate operations that benefit from WASM
- **Fallback Mechanisms**: Always provide TypeScript fallbacks
- **Performance Thresholds**: Use WASM for datasets above certain sizes
- **Type Optimization**: Optimize for common data types (numbers, strings)

### **Memory Management**
- **Copy-on-Write**: Share immutable data between views
- **Lazy Materialization**: Only materialize when absolutely necessary
- **Efficient BitSets**: Use packed bit arrays for boolean operations
- **Column Reuse**: Reuse column arrays when possible

### **Algorithm Selection**
- **Adaptive Algorithms**: Choose algorithms based on data characteristics
- **Batch Operations**: Process data in chunks for better cache performance
- **Specialized Paths**: Fast paths for common data patterns
- **Performance Monitoring**: Built-in performance analysis tools

## Error Handling Philosophy

### **Graceful Degradation**
- **WASM Fallbacks**: Automatic fallback to TypeScript when WASM fails
- **Type Validation**: Runtime type checking with helpful error messages
- **Data Validation**: Verify data integrity before operations
- **Performance Warnings**: Alert users to potential performance issues

### **Clear Error Messages**
- **Contextual Information**: Include relevant data context in errors
- **Actionable Guidance**: Suggest solutions to common problems
- **Type Information**: Show expected vs actual types
- **Performance Context**: Explain why operations might be slow

## Testing and Quality Philosophy

### **Comprehensive Examples**
- **Runnable Tests**: Every example is a Deno test that can be executed
- **Progressive Complexity**: Examples build from simple to complex
- **Real-world Data**: Use realistic data that demonstrates practical use cases
- **Edge Cases**: Cover boundary conditions and error scenarios

### **Performance Benchmarking**
- **Comparative Analysis**: Benchmark against established libraries (Arquero)
- **Performance Profiles**: Identify bottlenecks and optimization opportunities
- **Regression Testing**: Ensure performance improvements don't regress
- **Documentation**: Share performance characteristics with users

## Future Design Directions

### **Extensibility**
- **Plugin System**: Allow users to add custom operations
- **Custom Aggregators**: Support for user-defined aggregation functions
- **Data Source Integration**: Built-in support for various data formats
- **Visualization Integration**: Seamless integration with charting libraries

### **Performance Improvements**
- **Compiler Optimizations**: Generate optimized code for common patterns
- **Parallel Processing**: Leverage Web Workers for large datasets
- **Streaming**: Support for processing data that doesn't fit in memory
- **GPU Acceleration**: WebGPU integration for massive datasets

### **Developer Experience**
- **Interactive Documentation**: Live examples and playgrounds
- **Performance Profiling**: Built-in tools for analyzing operation performance
- **Debugging Tools**: Better visibility into DataFrame internals
- **Migration Guides**: Help users transition from other libraries

## Conclusion

tidy-ts represents a thoughtful approach to data manipulation in TypeScript. It combines the best of multiple worlds:

- **TypeScript's type safety** with **Rust's performance**
- **Tidy data principles** with **modern systems architecture**
- **Developer productivity** with **runtime performance**
- **Simplicity** with **power**

The design philosophy emphasizes that good software should be both fast and easy to use. By building on solid architectural foundations and providing intuitive APIs, tidy-ts enables developers to write data analysis code that is both performant and maintainable.

The library's success comes from its commitment to these principles while remaining pragmatic about implementation details. It's not just about being fast or being easy to use—it's about being both, in a way that makes sense for real-world data analysis workflows.
