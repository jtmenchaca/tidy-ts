# Duplicated Helper Patterns in `.verb.ts` Files

Audit of re-implemented logic across verb files. Each pattern includes a detailed breakdown of every implementation's differences to avoid false equivalence assumptions.

---

## 1. Group Adjacency List Iteration

**Severity: High | 10+ occurrences across 6 files**

Walking `head[g]` / `next[rowIdx]` linked lists to collect data per group. The core loop structure is shared but implementations diverge on mask filtering, index remapping, what's collected, and post-processing.

### Variant A: Mask-filtered index collection (truly identical)

**Files:** `filtering/slice.verb.ts` (7 functions), `filtering/distinct.verb.ts`, `sorting/shuffle.verb.ts`

```typescript
for (let g = 0; g < size; g++) {
  const groupIndices: number[] = [];
  let rowIdx = head[g];
  while (rowIdx !== -1) {
    if (!mask || bitsetGet(mask, rowIdx)) {
      groupIndices.push(rowIdx);
    }
    rowIdx = next[rowIdx];
  }
  // ... use groupIndices
}
```

- Uses `bitsetGet(mask, rowIdx)` for view-mask filtering
- Collects raw physical indices via `push()`
- No baseIndex remapping
- All 8 instances are copy-paste identical

### ~~Variant B: Unmasked index collection~~ (FIXED)

~~**File:** `sorting/shuffle.verb.ts`~~

**Fixed:** `shuffle.verb.ts` previously had no mask filtering and also had an index mismatch bug (using physical store indices to index into a logical spread array). Now uses Variant A pattern with `bitsetGet`, columnar row construction, `withGroupsRebuilt`, and `materializeIndex` for the ungrouped path.

### Variant C: BaseIndex-remapped, pre-allocated

**File:** `aggregate/summarise.verb.ts` (sync path)

```typescript
const groupIndices = new Array(count[g]);  // pre-allocated
let writePos = 0;
while (rowIdx !== -1) {
  const actualIdx = usesRawIndices ? rowIdx : baseIndex![rowIdx];
  groupIndices[writePos] = actualIdx;
  writePos++;
  rowIdx = next[rowIdx];
}
```

- **Pre-allocates** array with `count[g]` (avoids push overhead)
- **Remaps indices** through `baseIndex` when view is active
- Wrapped in `tracer.withSpan()`

### Variant D: BaseIndex-remapped, reversed

**File:** `aggregate/summarise.verb.ts` (async path)

- Uses `push()` instead of pre-allocation
- Adds `groupIndices.reverse()` after collection
- Same baseIndex remapping as Variant C

### ~~Variant E: Row collection (not indices)~~ (FIXED)

~~**Files:** `utility/downsample.verb.ts`, `utility/upsample.verb.ts`~~

**Fixed:** Both `downsample.verb.ts` and `upsample.verb.ts` previously collected rows from a `[...df]` spread array using physical adjacency list indices — same index mismatch bug as shuffle. Also had no mask filtering. Now both use mask-filtered adjacency list iteration with `bitsetGet`, `baseIndex` remapping, and columnar store row construction.

Additionally, `aggregate/summarise-columns.verb.ts` had all 3 bugs (no mask, index mismatch via `[...df]`, no baseIndex). Fixed to use mask-filtered columnar store access.

`transformation/mutate-columns.verb.ts` row-based path had no mask filtering in its adjacency list walk. Fixed by removing the unnecessary adjacency list iteration entirely — `mutate_columns` applies row-level functions identically regardless of group membership, so the grouped and ungrouped paths now share the same loop over `out[]`.

### Extractability assessment

A shared helper could cover Variants A-D with parameters:

```typescript
collectGroupIndices({
  head, next, groupIndex,
  mask?,          // Variant A
  baseIndex?,     // Variant C/D
  preAllocSize?,  // Variant C
}) => number[]
```

> **Note:** `shuffle.verb.ts`, `downsample.verb.ts`, `upsample.verb.ts`, `summarise-columns.verb.ts`, and `mutate-columns.verb.ts` all had variants of the same bug class (missing mask, index mismatch, or both) and have been fixed.

---

## 2. Empty DataFrame Construction (Schema-Preserving)

**Severity: High | 10+ occurrences across 7+ files**

Two fundamentally different approaches exist — these are NOT equivalent and cannot share a single helper without care.

### Approach A: `createDataFrame({columns: ...})`

**Files:** `filtering/slice.verb.ts` (7x), `filtering/distinct.verb.ts`

```typescript
createDataFrame({
  columns: Object.fromEntries(
    store.columnNames.map((col: string) => [col, []]),
  ),
})
```

- Column names from `store.columnNames` (slice) or `outputCols` (distinct)
- Uses the row-or-column `createDataFrame` constructor
- No type cast in slice; `as unknown as DataFrame<Row>` in distinct

### Approach B: `createColumnarDataFrameFromStore({...})`

**Files:** All join verbs

```typescript
createColumnarDataFrameFromStore({
  columns,
  length: 0,
  columnNames: allCols,
})
```

- Column names merged from `left.columns()` and `right.columns()` via `Set`
- Uses the columnar store constructor (different from Approach A)
- Always cast `as unknown as any`

### Approach B sub-variants (join-specific)

| Join | Trigger condition | Column order | Extra logic |
|------|------------------|--------------|-------------|
| inner-join | Either side empty | `[...leftCols, ...rightCols]` | None |
| left-join | Left empty only | `[...leftCols, ...rightCols]` | None |
| right-join (empty right) | Right empty | `[...rightCols, ...leftCols]` | **Right-first ordering** |
| right-join (empty left) | Left empty | Custom build | **Copies right data, fills left with `undefined`** |
| outer-join (both empty) | Both empty | `[...leftCols, ...rightCols]` | None |
| outer-join (one empty) | One side empty | Custom build | **Copies non-empty side data, fills other with `undefined`** |
| cross-join | Either empty | `[]` | **Drops all columns** (empty object) |

### Extractability assessment

Two helpers could cover this:

1. `createEmptyDataFrameWithSchema(columnNames)` — for Approach A (slice, distinct)
2. The join-specific variants with data-fill logic are too divergent for a single helper. The "both empty" case could use helper #1, but the "one side empty with data fill" cases in right-join and outer-join are join-specific.

---

## 3. Row Construction from Columnar Store

**Severity: Medium (downgraded from High) | 4 files with true duplication**

Initial analysis suggested 5+ files, but deep dive reveals several files don't actually use this pattern.

### True duplicates (identical pattern)

**Files:** `filtering/slice.verb.ts` (7x), `filtering/distinct.verb.ts`, `sorting/shuffle.verb.ts`, `reshape/append.verb.ts`

```typescript
const row: any = {};
for (const colName of store.columnNames) {
  row[colName] = store.columns[colName][physicalIndex];
}
rebuilt.push(row);
```

- Column names from `store.columnNames` (slice, shuffle, append) or `outputCols` (distinct)
- Direct physical index (no remapping)
- Row typed as `any` (slice, shuffle, append) or `as Row` (distinct)

### NOT actually this pattern

| File | Actual approach |
| `aggregate/summarise.verb.ts` | Builds computed result objects from key + aggregation, not store reconstruction |
| `utility/downsample.verb.ts` | Spreads `groupKeys` + adds time column, not columnar |
| `utility/upsample.verb.ts` | Same as downsample |
| `reshape/bind-rows.verb.ts` | Works directly with columnar concatenation, no row objects |

### Extractability assessment

Viable for the 4 files (slice, distinct, shuffle, append) that truly share this pattern. The `summarise.verb.ts` async path also builds rows from columnar data but uses a locally-extracted `groupColumns` intermediate, which is close enough to share with a slight signature change.

---

## 4. Column Store Rebuild from Selected Indices

**Severity: High | 7+ occurrences across 3+ files, but with real divergences**

### Variant A: Plain array allocation (no typed array awareness)

**Files:** `filtering/slice.verb.ts` (4 functions), `selection/drop.verb.ts`

```typescript
const newCol = new Array(indices.length);
for (let i = 0; i < indices.length; i++) {
  newCol[i] = sourceCol[indices[i]];
}
```

- Always allocates `new Array()` regardless of source column type
- Indices from `number[]` (slice) or `Uint32Array` (drop)
- Identical across all slice functions and drop

### Variant B: Typed-array-preserving allocation

**Files:** `join/left-join.verb.ts`, `join/left-join-parallel.verb.ts`

```typescript
const dst = allocLikeLeft(src, n);  // preserves Float64Array, Int32Array, etc.
if (ArrayBuffer.isView(dst) && !(dst instanceof DataView)) {
  for (let i = 0; i < n; i++) (dst as any)[i] = src[leftViewIndex[leftIndices[i]]];
} else {
  for (let i = 0; i < n; i++) (dst as any[])[i] = src[leftViewIndex[leftIndices[i]]];
}
```

- `allocLikeLeft()` tries to match source typed array constructor
- Falls back to plain Array on failure
- Double-mapped indices (`viewIndex[joinIndices[i]]`) in left-join; direct indices in left-join-parallel

### Variant C: Run-aware gathering (right columns in left-join)

**Files:** `join/left-join.verb.ts`, `join/left-join-parallel.verb.ts`

```typescript
while (i < n) {
  const r = rightIndices[i]!;
  let j = i + 1;
  while (j < n && rightIndices[j] === r) j++;  // find runs
  if (r === RIGHT_NULL || !src) {
    for (let k = i; k < j; k++) (dst as any[])[k] = undefined;
  } else {
    const val = src[rightViewIndex[r]];  // fetch once per run
    for (let k = i; k < j; k++) (dst as any[])[k] = val;
  }
  i = j;
}
```

- Optimizes repeated right-side matches by fetching once per run
- Only used for right-side columns in left joins

### Existing helpers in `join/join-helpers.ts`

| Helper | Behavior |
|--------|----------|
| `copyColumnWithIndex(source, indices, length)` | Plain array, single column, non-nullable |
| `copyColumnWithNullableIndex(source, baseIndices, length)` | Plain array, single column, `NA_U32` → `undefined` |
| `copyDataFrameColumns(storeAndIndex)` | Full store rebuild, plain arrays, non-nullable |

These exist but are not imported outside `join/`.

### Extractability assessment

Variant A (slice, drop) and `copyDataFrameColumns` are functionally identical — just need to move the helper to a shared location. Variants B and C are join-specific optimizations that should stay in join code.

---

## 5. RowView Cursor Class

**Severity: High | 6 identical definitions across 2 files**

### All implementations are identical

**Files:** `filtering/slice.verb.ts` (4 definitions: slice_indices, slice_min, slice_max, slice_sample), `selection/drop.verb.ts` (1 definition)

```typescript
class RowView {
  private _i = 0;
  constructor(
    private cols: Record<string, unknown[]>,
    private names: (string | symbol)[],
  ) {
    for (const name of names) {
      Object.defineProperty(this, name, {
        get: () => this.cols[name as string][this._i],
        enumerable: true,
      });
    }
  }
  setCursor(i: number) { this._i = i; }
}
```

All 5 instances are character-for-character identical:
- Same constructor signature: `(cols, names)`
- Same `defineProperty` config: `{ get, enumerable: true }` (configurable defaults to false)
- Same `setCursor` method
- All instantiated as `new RowView(store.columns, store.columnNames)` and assigned to `(out as any).__rowView`

### One exception: empty stub

`selection/drop.verb.ts` also has a zero-column stub RowView with no column definitions, used only when all columns are dropped.

### Extractability assessment

This is the cleanest extraction candidate. A single `RowView` class (or factory function) exported from a shared module would eliminate 5 identical class definitions with zero behavioral change.

---

## 6. `parseJoinKeys` / Hash Map Join Logic

**Severity: High | 3 files bypass existing shared helpers**

### parseJoinKeys implementations

All 4 implementations (1 shared, 3 local) handle the same argument shapes and produce the same output. Differences are cosmetic:

| Implementation | Location | Differences from `join-helpers.ts` |
|----------------|----------|-----------------------------------|
| `parseJoinArgs` | `join-helpers.ts:101-141` | Canonical version, uses `normalizeJoinKeys()` |
| `parseJoinKeys` | `inner-join.verb.ts:31-67` | Inline returns (no intermediate vars) |
| `parseJoinKeys` | `left-join.verb.ts:63-94` | Uses intermediate `leftKeys`/`rightKeys` vars |
| `parseJoinKeys` | `left-join-parallel.verb.ts:79-110` | Identical to left-join version |

**All are functionally equivalent.** The local versions can be replaced by `parseJoinArgs` with no behavioral change.

### Hash map join implementations

Here the differences are more significant:

| Aspect | `join-helpers.ts` | inner/left/left-parallel/right/outer |
|--------|-------------------|--------------------------------------|
| Map key type | `Map<unknown, number[]>` (raw values) | `Map<string, number[]>` (stringified) |
| Composite key separator | N/A (single-key only) | `"|"` pipe character |
| Composite key handling | Caller must pre-compose keys | Built-in via `String(col[i]).join("|")` |
| Sentinel for unmatched | `null` in return arrays | `RIGHT_NULL` (0xFFFFFFFF) in left-join; `null` in right/outer |

**Key risk:** The `"|"` separator in local implementations can produce false collisions (e.g., keys `["a|b", "c"]` vs `["a", "b|c"]` would hash identically). The shared helper's `projectCompositeKeyColumn` uses `"\0"` (null byte) separator, which is safer.

### WASM path differences

- `join-helpers.ts` `executeJoinWithAdaptiveStrategy`: threshold-based (>1000 rows → JS, ≤1000 → WASM), handles inner/left/outer
- Local implementations in inner-join, left-join: Have their own WASM paths with `convertToTypedArrays` + direct WASM calls
- `right-join.verb.ts`, `outer-join.verb.ts`: Use `setupJoinOperation` from helpers (correct usage)

### Extractability assessment

`parseJoinKeys` can be trivially replaced. The hash map logic is more nuanced — the local implementations handle composite keys inline while the shared helper expects pre-composed keys. Migration would require using `projectCompositeKeyColumn` (which already exists and is safer with `"\0"` separator).

---

## 7. Group-Aware Branching + Group Rebuilding

**Severity: Medium | 11 files, but 4 distinct strategies — NOT a single duplicated pattern**

Deep analysis reveals this is not one pattern but four different group-handling strategies:

### Strategy A: `withGroupsRebuilt(gdf, rows[], outDf)` — 3-param rebuild

**Files:** `slice.verb.ts` (7 functions), `distinct.verb.ts`, `arrange.verb.ts`, `shuffle.verb.ts`, `inner-join.verb.ts`, `left-join.verb.ts`

- Detects via `if (groupedDf.__groups)`
- Performs grouped operation (adjacency list iteration, per-group processing)
- Rebuilds groups from scratch via `withGroupsRebuilt(sourceGdf, rebuiltRows, outputDf)`
- arrange.verb.ts and join verbs call `.toArray()` on result first; slice/distinct pass array directly

### Strategy B: `withGroups(gdf, outDf)` — 2-param preserve

**Files:** `transformation/mutate-columns.verb.ts`, `utility/dummy-col.verb.ts`

- Detects via `if (groupedDf.__groups)`
- Does NOT rebuild groups from rows — assumes group structure unchanged
- Calls `withGroups(sourceGdf, outputDf)` to copy group metadata

### Strategy C: Mask/metadata preservation (no rebuild)

**Files:** `filtering/filter.verb.ts`, `selection/select.verb.ts`

- filter.verb.ts: Uses `withMask()`, copies `__groups` directly
- select.verb.ts: Uses `preserveDataFrameMetadata()` — no explicit group check

### Strategy D: No group preservation

**Files:** `aggregate/summarise.verb.ts`

- summarise.verb.ts: Returns `createDataFrame(results)` — groups collapsed by design (different cardinality)

> **Note:** `shuffle.verb.ts` previously dropped groups (Strategy D) but has been fixed to use `withGroupsRebuilt` (Strategy A).

### Extractability assessment

This is NOT a good extraction candidate. The 4 strategies serve different semantic purposes:
- Strategy A: Row-filtering operations that change which rows exist
- Strategy B: Column-transforming operations that preserve row identity
- Strategy C: View-based operations that don't materialize
- Strategy D: Operations that intentionally change cardinality

The boilerplate `if (__groups)` check is minimal. Abstracting this would add complexity without meaningful deduplication.

---

## 8. Null-Safe Comparator (Sort Logic)

**Severity: Medium | 4 distinct implementations across 3 files**

All share the same type-check cascade but differ in null handling placement and direction support.

### Implementation A: Ascending with inline null handling

**Files:** `slice.verb.ts` (slice_min), `arrange.verb.ts` (ascending path)

```typescript
if (aVal == null && bVal == null) return 0;
if (aVal == null) return 1;   // nulls last
if (bVal == null) return -1;
if (typeof aVal === "number" && typeof bVal === "number") return aVal - bVal;
if (aVal instanceof Date && bVal instanceof Date) return aVal.getTime() - bVal.getTime();
if (isComparable(aVal) && isComparable(bVal)) return aVal.constructor.compare(aVal, bVal);
return String(aVal).localeCompare(String(bVal));
```

- Null checks inside comparator
- Hardcoded ascending

### Implementation B: Descending with external null handling

**File:** `slice.verb.ts` (slice_max)

- Nulls pre-filtered **outside** the comparator (upstream filter)
- No null checks in comparator body
- All comparisons reversed: `bVal - aVal`, `compare(bVal, aVal)`, etc.

### Implementation C: Descending with inline null handling

**File:** `arrange.verb.ts` (descending path)

- Null checks **inside** comparator (unlike slice_max)
- All comparisons reversed
- Inconsistent with slice_max's approach to null handling

### Implementation D: Direction-parameterized

**File:** `selection/extract-nth-where-sorted.verb.ts`

```typescript
if (typeof aVal === "number" && typeof bVal === "number") {
  return direction === "desc" ? bVal - aVal : aVal - bVal;
}
```

- Null checks inside comparator
- Direction checked at every type branch
- Most flexible — handles both asc/desc via parameter

### No implementation handles NaN explicitly

All treat NaN numbers the same as any other number (which means `NaN - NaN` returns `NaN`, and `NaN - x` returns `NaN`, causing unstable sort behavior).

### Extractability assessment

A shared `compareValues(a, b, direction)` matching Implementation D's approach would cover all cases. The null-handling inconsistency between slice_max (external) and arrange descending (internal) should be resolved — inline null handling is safer.

---

## 9. Float64 Coercion

**Severity: Low (downgraded from Medium) | 2 functionally identical implementations**

### Implementation A: `arrange.verb.ts` — `coerceToF64()`

```typescript
out[i] = v == null ? Number.NaN
  : v instanceof Date ? +v
  : typeof v === "number" ? v
  : Number.NaN;
```

Check order: null → Date → number → NaN

### Implementation B: `filter.verb.ts` — inline in `tryWasmFilterPathNumericOnly`

```typescript
values[i] = v == null ? Number.NaN
  : typeof v === "number" ? v
  : v instanceof Date ? +v
  : Number.NaN;
```

Check order: null → number → Date → NaN

### Analysis

- **Functionally identical** — same output for every input type
- Check order differs (Date-first vs number-first) but a value can't be both
- Neither handles: bigint, boolean, string (all become NaN)
- Both return `Float64Array`

### Extractability assessment

Trivial to extract but low impact (only 2 call sites). Worth extracting if other WASM paths need the same coercion in the future.

---

## 10. Date Part Extraction

**Severity: Low | 3 identical functions in 1 file differing by 1 method call**

### `utility/dates.verb.ts` — `year()`, `month()`, `day()`

All three functions are structurally identical:
- Same signature: `<T>(col: keyof T) => (df: DataFrame<T>) => DataFrame<T>`
- Same null handling: `value == null` → `null`
- Same Date coercion: `instanceof Date` → use directly; `string | number` → `new Date(value)` with `isNaN` check
- Same output method: `df.mutate({ [colName]: () => values })`

| Function | Final method | Return range |
|----------|-------------|--------------|
| `year` | `date.getFullYear()` | 1900-9999 |
| `month` | `date.getMonth() + 1` | 1-12 |
| `day` | `date.getDate()` | 1-31 |

### Extractability assessment

Clean extraction into `extractDatePart(col, extractor)` where extractor is `(d: Date) => number`. Zero risk.

---

## Summary

| # | Pattern | Status | Extracted to |
|---|---------|--------|-------------|
| 1 | Group adjacency list iteration | **EXTRACTED** | `verb-helpers.ts → collectGroupIndices()` |
| 2 | Empty DataFrame with schema | Remaining (low priority) | — |
| 3 | Row from columnar store | Remaining (low priority) | — |
| 4 | Store rebuild from indices | **EXTRACTED** | `verb-helpers.ts → buildDataFrameFromIndices()` |
| 5 | RowView cursor class | **EXTRACTED** | `verb-helpers.ts → class RowView` |
| 6 | parseJoinKeys | **EXTRACTED** | 3 local copies deleted, now import `parseJoinArgs` from `join-helpers.ts` |
| 7 | Group-aware branching | N/A — not duplicated | — |
| 8 | Null-safe comparator | **EXTRACTED** | `verb-helpers.ts → compareValues()` |
| 9 | Float64 coercion | Remaining (low priority) | — |
| 10 | Date part extraction | Remaining (low priority) | — |

### Shared helpers in `verb-helpers.ts`

| Helper | Replaces | Used by |
|--------|----------|---------|
| `class RowView` | 8 local class definitions | slice, drop, mutate-columns, mutate-helpers-sync, mutate-group |
| `collectGroupIndices()` | 10 inline adjacency-list loops | slice (7), distinct, shuffle, summarise-columns, downsample, upsample |
| `buildDataFrameFromIndices()` | 4 store-rebuild blocks | slice (4) |
| `compareValues()` | 4 inline comparator functions | slice_min (2), slice_max (2), extract-nth-where-sorted |

### Also cleaned up

- 3 local `parseJoinKeys` copies deleted from `inner-join.verb.ts`, `left-join.verb.ts`, `left-join-parallel.verb.ts` — now import `parseJoinArgs` from `join-helpers.ts`
- 3 local `getStoreAndIndex` copies deleted from same files — now import from `join-helpers.ts`
- `mutate-shared-helpers.ts` deleted (was a single re-export wrapper)

### Remaining (low priority)

- **Pattern 2 (empty DataFrame)** — only 2 approaches, low dedup value
- **Pattern 3 (row construction)** — 3 true sites, medium value
- **Pattern 9 (f64 coercion)** — 2 sites, low value
- **Pattern 10 (date extraction)** — 1 file, internal refactor only
