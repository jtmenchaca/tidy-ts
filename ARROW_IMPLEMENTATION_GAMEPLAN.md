# Apache Arrow Integration Game Plan for Tidy-TS

## Overview
This document outlines a comprehensive plan to add Apache Arrow support to the tidy-ts dataframe library, following the established patterns used for CSV and Parquet integration.

## 📋 Current State Analysis

### Existing I/O Structure
- **CSV**: `read_csv.ts` + `writeCSV.verb.ts` (complete with Zod validation)
- **Parquet**: `read_parquet.ts` + `writeParquet.verb.ts` (complete with Zod validation)
- **JSON**: `read_json.ts` + `write_json.ts` (basic implementation)

### Established Patterns
1. **Reader functions** in `/io/` directory with Zod schema validation
2. **Writer verbs** in `/verbs/utility/` directory for chaining
3. **Type test files** ensuring proper Zod type inference
4. **Fixture files** for reliable testing
5. **Export through** `/io/index.ts` for public API

## 🎯 Goals for Arrow Integration

### Primary Objectives
1. **Reading Arrow files** with full Zod schema validation and type inference
2. **Writing Arrow files** as chainable DataFrame verbs
3. **Memory efficiency** leveraging Arrow's columnar format
4. **Streaming support** for large datasets
5. **Interoperability** with other Arrow-compatible tools

### Performance Benefits
- Columnar data format (better compression and query performance)
- Zero-copy reads in many cases
- Efficient memory layout for analytics
- Cross-language compatibility

## 📦 Dependencies & Setup

### Library Selection
```typescript
// Primary choice: Official Apache Arrow for JavaScript
import { Table, Vector, Field, Schema, Type, RecordBatch } from 'apache-arrow';

// Alternative for Deno (if needed):
import { ... } from "npm:apache-arrow@latest";
```

### Import Map Addition
```json
{
  "imports": {
    "apache-arrow": "npm:apache-arrow@^15.0.0"
  }
}
```

## 🏗️ Implementation Plan

### Phase 1: Foundation & Reading (Week 1-2)

#### 1.1 Core Reader Implementation
**File**: `src/dataframe/ts/io/read_arrow.ts`

```typescript
// Key components to implement:
// - Arrow table parsing with schema detection
// - Zod integration for type validation and coercion
// - Support for streaming and batch reading
// - Column selection and row range support
// - NA/null value handling consistent with CSV/Parquet

export async function read_arrow<S extends z.ZodObject<any>>(
  pathOrBuffer: string | ArrayBuffer,
  schema: S,
  opts: ArrowOptions & NAOpts = {},
): Promise<DataFrame<z.infer<S>>>
```

#### 1.2 Arrow-specific Options
```typescript
export type ArrowOptions = {
  columns?: string[];
  rowStart?: number;
  rowEnd?: number;
  batchSize?: number;      // For streaming
  streaming?: boolean;     // Enable streaming mode
  flattenNested?: boolean; // Handle nested Arrow types
};
```

#### 1.3 Zod Integration Helpers
```typescript
// Similar to existing zparquet helpers but for Arrow types
export const zarrow = {
  string: make<z.ZodString, (val: unknown) => string>((val) => toString(val)),
  number: make<z.ZodNumber, (val: unknown) => number>((val) => toNumber(val)),
  boolean: make<z.ZodBoolean, (val: unknown) => boolean>((val) => toBoolean(val)),
  date: make<z.ZodDate, (val: unknown) => Date>((val) => toDate(val)),
  // Arrow-specific types:
  timestamp: make<z.ZodDate, (val: unknown) => Date>((val) => toTimestamp(val)),
  list: make<z.ZodArray<any>, (val: unknown) => any[]>((val) => toArray(val)),
};
```

### Phase 2: Writing Support (Week 2-3)

#### 2.1 Write Verb Implementation
**File**: `src/dataframe/ts/verbs/utility/writeArrow.verb.ts`

```typescript
// DataFrame method chaining support
export function writeArrow<Row extends Record<string, unknown>>(
  filePath: string,
  opts: ArrowWriteOptions = {}
): (df: DataFrame<Row>) => DataFrame<Row>;

// Arrow buffer creation
export function toArrowBuffer<Row extends Record<string, unknown>>(
  opts: ArrowWriteOptions = {}
): (df: DataFrame<Row>) => ArrayBuffer;
```

#### 2.2 Arrow Schema Generation
```typescript
// Convert DataFrame structure to Arrow schema
function dataFrameToArrowSchema<T extends Record<string, unknown>>(
  dataFrame: DataFrame<T>
): Schema;

// Convert DataFrame to Arrow Table
function dataFrameToArrowTable<T extends Record<string, unknown>>(
  dataFrame: DataFrame<T>
): Table;
```

### Phase 3: Advanced Features (Week 3-4)

#### 3.1 Streaming Support
```typescript
// For large datasets
export async function* read_arrow_stream<S extends z.ZodObject<any>>(
  pathOrBuffer: string | ArrayBuffer,
  schema: S,
  opts: ArrowStreamOptions = {},
): AsyncGenerator<DataFrame<z.infer<S>>, void, unknown>;
```

#### 3.2 Schema Inference
```typescript
// Auto-generate Zod schema from Arrow schema
export function inferZodFromArrow(arrowSchema: Schema): z.ZodObject<any>;
```

#### 3.3 Complex Type Support
- **Lists/Arrays**: Handle Arrow list types
- **Structs**: Handle nested objects
- **Unions**: Handle union types
- **Timestamps**: Proper timezone handling
- **Decimal**: High-precision numbers

### Phase 4: Testing & Documentation (Week 4-5)

#### 4.1 Test Files Structure
```
src/dataframe/ts/io/
├── read_arrow.test.ts           # Basic functionality
├── read_arrow-types.test.ts     # Type inference tests
└── fixtures/
    ├── penguins_test.arrow      # Test fixture
    ├── complex_types.arrow      # Nested/complex types
    └── large_dataset.arrow      # Performance testing
```

#### 4.2 Test Coverage Areas
- Basic reading/writing functionality
- Type inference with Zod schemas
- Column selection and row filtering
- Streaming capabilities
- Complex Arrow types (lists, structs, timestamps)
- Performance benchmarks vs CSV/Parquet
- Memory usage validation

## 🔄 Implementation Steps (Detailed)

### Step 1: Setup & Dependencies
```bash
# Add Apache Arrow to import map
# Test basic Arrow functionality in isolation
# Create minimal proof of concept
```

### Step 2: Core Reading Implementation
1. **File structure**: Copy `read_parquet.ts` as template
2. **Arrow parsing**: Replace hyparquet with apache-arrow
3. **Schema handling**: Adapt Arrow schema to Zod validation
4. **Type conversion**: Implement Arrow → JavaScript type mapping
5. **Options support**: Column selection, row ranges, etc.

### Step 3: Zod Integration
1. **Arrow type detection**: Map Arrow types to Zod types
2. **Validation pipeline**: Integrate with existing parseContent pattern
3. **Coercion helpers**: Create zarrow helpers similar to zparquet
4. **Error handling**: Proper error messages for type mismatches

### Step 4: Write Verb Implementation
1. **DataFrame → Arrow**: Convert DataFrame to Arrow Table
2. **Schema generation**: Auto-generate Arrow schema from data
3. **File writing**: Save Arrow files to disk
4. **Buffer generation**: Create in-memory Arrow buffers
5. **Chaining support**: Return DataFrame for method chaining

### Step 5: Testing & Validation
1. **Unit tests**: Basic read/write functionality
2. **Type tests**: Zod schema inference validation  
3. **Integration tests**: Real-world data scenarios
4. **Performance tests**: Memory usage and speed benchmarks
5. **Fixture creation**: Reliable test data files

### Step 6: Documentation & Examples
1. **API documentation**: JSDoc comments
2. **Usage examples**: Common use cases
3. **Migration guide**: From CSV/Parquet to Arrow
4. **Performance guide**: When to use Arrow vs other formats

## 🚀 Advanced Features (Future Phases)

### Phase 5: Advanced Analytics Integration
- **Arrow Flight**: Network protocol support
- **Compute Functions**: Leverage Arrow compute capabilities
- **Plasma Integration**: Shared memory object store
- **GPU Support**: CUDA/OpenCL integration for large datasets

### Phase 6: Ecosystem Integration
- **DuckDB Integration**: Arrow as intermediate format
- **Python Integration**: PyArrow interoperability
- **R Integration**: Arrow R package compatibility
- **Spark Integration**: Arrow as Spark interchange format

## ⚠️ Potential Challenges & Solutions

### Challenge 1: Bundle Size
- **Problem**: Apache Arrow library size impact
- **Solution**: Tree-shaking, dynamic imports, optional dependencies

### Challenge 2: Browser Compatibility  
- **Problem**: Node.js file system APIs in browser
- **Solution**: Separate browser/Node implementations, WebAssembly fallbacks

### Challenge 3: Complex Type Mapping
- **Problem**: Arrow's rich type system vs JavaScript limitations
- **Solution**: Careful type conversion, user education, optional complexity

### Challenge 4: Memory Management
- **Problem**: Arrow's memory layout vs JavaScript GC
- **Solution**: Proper buffer management, streaming for large data

## 📊 Success Metrics

### Performance Goals
- **Read Performance**: 2-5x faster than CSV for large datasets
- **Memory Usage**: 30-50% less memory than equivalent JSON/CSV
- **Write Performance**: Comparable to Parquet, faster than CSV

### Feature Goals
- **100% TypeScript Support**: Full type inference with Zod
- **Streaming Support**: Handle datasets larger than memory
- **Complex Types**: Support for all common Arrow types
- **Cross-platform**: Work in Deno, Node.js, and modern browsers

## 🎯 Delivery Timeline

### Week 1-2: Foundation
- [ ] Dependencies setup
- [ ] Basic read_arrow.ts implementation
- [ ] Core Zod integration
- [ ] Basic test suite

### Week 3: Writing & Advanced Reading
- [ ] writeArrow.verb.ts implementation
- [ ] Column selection and filtering
- [ ] Complex type support
- [ ] Streaming prototype

### Week 4-5: Testing & Polish
- [ ] Comprehensive test suite
- [ ] Performance benchmarking
- [ ] Documentation
- [ ] Real-world validation

### Week 6: Integration & Release
- [ ] Integration with existing codebase
- [ ] Export through io/index.ts
- [ ] Final testing and bug fixes
- [ ] Documentation and examples

## 🔗 Files to Create/Modify

### New Files
```
src/dataframe/ts/io/read_arrow.ts
src/dataframe/ts/io/read_arrow.test.ts
src/dataframe/ts/io/read_arrow-types.test.ts
src/dataframe/ts/io/fixtures/penguins_test.arrow
src/dataframe/ts/io/fixtures/complex_types.arrow
src/dataframe/ts/verbs/utility/writeArrow.verb.ts
src/dataframe/ts/verbs/utility/writeArrow.test.ts
```

### Modified Files
```
src/dataframe/ts/io/index.ts              # Add Arrow exports
src/dataframe/ts/verbs/utility/index.ts   # Add writeArrow verb
import_map.json                           # Add apache-arrow dependency
```

This comprehensive game plan provides a structured approach to implementing full Apache Arrow support in the tidy-ts library, following established patterns while leveraging Arrow's unique capabilities for high-performance data processing.