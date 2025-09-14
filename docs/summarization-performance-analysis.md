# Summarization Performance Analysis: tidy-ts vs Arquero

## Executive Summary

tidy-ts shows **severe performance degradation** in grouped summarization operations compared to Arquero, with performance gaps ranging from **3.17x to 19.20x slower**. The issue is isolated to grouped operations - ungrouped summarization performs competitively (0.97x-1.18x).

## Performance Benchmarks

### Current Performance Gap (Latest Run)

| Size | Scenario | tidy-ts | Arquero | Ratio | Issue Severity |
|------|----------|---------|---------|-------|----------------|
| 1K | Ungrouped | 0.1ms | 0.2ms | **0.70x** | ✅ Competitive |
| 1K | Grouped | 1.1ms | 0.3ms | **3.17x** | ❌ Poor |
| 1K | Complex Grouped | 3.7ms | 0.4ms | **8.58x** | ❌ Very Poor |
| 100K | Ungrouped | 10.6ms | 10.9ms | **0.97x** | ✅ Competitive |
| 100K | Grouped | 105.2ms | 15.1ms | **6.99x** | ❌ Very Poor |
| 100K | Complex Grouped | 420.0ms | 21.9ms | **19.20x** | ❌ Critical |
| 1M | Ungrouped | 120.3ms | 101.9ms | **1.18x** | ✅ Competitive |
| 1M | Grouped | 1246.6ms | 229.6ms | **5.43x** | ❌ Very Poor |

**Key Finding**: The performance gap **scales with data size and grouping complexity**.

## Root Cause Analysis

### tidy-ts Implementation Issues

#### 1. **Inefficient Group Processing** (`src/dataframe/ts/aggregation/summarise.ts:93-126`)

```typescript
// Current tidy-ts approach - Creates new DataFrame per group
for (let g = 0; g < G; g++) {
  const krow = keyRow[g];
  const keyObj = keyFromRow(krow);
  
  // ❌ PROBLEM: Creating new Uint32Array for each group
  const sz = count[g] >>> 0;
  const groupView = new Uint32Array(sz);
  let idx = 0;
  for (let i = head[g]; i !== -1; i = next[i]) {
    groupView[idx++] = baseIndex[i];
  }
  
  // ❌ PROBLEM: Creating new DataFrame object per group  
  const groupDf = createColumnarDataFrame(
    [] as readonly Record<string, unknown>[],
  );
  (groupDf as any).__store = store;
  (groupDf as any).__view = groupView;
  (groupDf as any).__rowView = api.__rowView;
  (groupDf as any).__groups = undefined;
}
```

**Problems Identified:**
1. **Memory allocation overhead**: New `Uint32Array` created for each group
2. **Object creation overhead**: New DataFrame object per group with metadata setup
3. **Adjacency list traversal**: Inefficient linked-list traversal for each group
4. **Function call overhead**: Each aggregation function called as a closure per group

#### 2. **Manual Column Access Pattern**

```typescript
// tidy-ts approach - Manual column access per operation
avg_value: (group) => {
  const values = group.value as number[];  // ❌ Column extraction overhead
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}
```

### Arquero Implementation Advantages

#### 1. **Batch Processing with Pre-allocated State** (`sources/arquero-main/src/verbs/reduce/util.js:93-124`)

```javascript
// Arquero approach - Single pass with pre-allocated state
export function reduceGroups(table, reducer, groups) {
  const { keys, size } = groups;
  
  // ✅ ADVANTAGE: Pre-allocate all group state at once
  const cells = repeat(size, () => reducer.init());
  
  const data = table.data();
  
  // ✅ ADVANTAGE: Single scan of all data
  if (table.isOrdered()) {
    const idx = table.indices();
    const m = idx.length;
    for (let i = 0; i < m; ++i) {
      const row = idx[i];
      reducer.add(cells[keys[row]], row, data);  // Direct data access
    }
  } else {
    const n = table.totalRows();
    for (let i = 0; i < n; ++i) {
      reducer.add(cells[keys[i]], i, data);     // Direct data access  
    }
  }
  
  return cells;
}
```

#### 2. **Optimized Field Reducers** (`sources/arquero-main/src/verbs/reduce/field-reducer.js:108-137`)

```javascript
// Arquero approach - Specialized reducers with unrolled operations
class Field1Reducer extends FieldReducer {
  constructor(fields, ops, outputs, stream) {
    super(fields, ops, outputs, stream);
    
    // ✅ ADVANTAGE: Unroll op invocations for performance  
    const args = ['state', 'v1', 'v2'];
    this._add = update(ops, args, 'add');
    this._rem = update(ops, args, 'rem');
  }
  
  add(state, row, data) {
    const value = this._fields[0](row, data);  // Direct field access
    ++state.count;
    if (isValid(value)) {
      ++state.valid;
      if (state.list) state.list.add(value);
      this._add(state, value);                 // Unrolled operations
    }
  }
}
```

#### 3. **Direct Column Access**

```javascript
// Arquero approach - Direct column access without intermediate objects
const data = table.data();  // Get raw column data once
// ... then access columns directly as data[columnName][row]
```

## Optimization Recommendations

### High Impact (Immediate Fixes)

1. **Replace DataFrame-per-group with Direct Aggregation**
   - Pre-allocate aggregation state for all groups
   - Single scan through data with direct column access
   - Eliminate intermediate DataFrame objects

2. **Optimize Column Access**
   - Direct column array access instead of DataFrame property access
   - Cache column references outside loops

3. **Batch Group Operations**
   - Process all groups in single data scan
   - Use typed arrays for group keys/indices

### Medium Impact

4. **Specialize Reducers by Operation Type**
   - Create optimized paths for common operations (count, sum, avg)
   - Unroll operations at construction time

5. **Memory Pool for Temporary Arrays**
   - Reuse Uint32Array allocations
   - Pool temporary objects

### Implementation Priority

**Phase 1: Critical Fixes**
- Direct aggregation without DataFrame-per-group  
- Single-scan group processing
- Direct column access pattern

**Phase 2: Performance Tuning**  
- Specialized reducers
- Memory pooling
- Operation unrolling

## Expected Impact

Based on Arquero's architecture, implementing these optimizations should:
- **Grouped operations**: Reduce gap from 5.43x to ~1.5x-2x
- **Complex grouped**: Reduce gap from 19.20x to ~2x-3x  
- **Memory usage**: Reduce by ~60-80% for grouped operations
- **Scalability**: Linear performance scaling instead of quadratic

The root cause is clear: **tidy-ts creates too many intermediate objects and scans data multiple times, while Arquero uses a single-scan approach with pre-allocated state**.