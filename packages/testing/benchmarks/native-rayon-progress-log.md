# Native + Rayon Sort Optimization Progress Log

## Mistakes to Avoid

1. **Assume napi-rs is the active backend**. Deno, Node, and Bun all load the `.node` addon — WASM is only the browser fallback. Always optimize the napi path first; WASM changes alone won't show up in benchmarks.
2. **Don't profile by guessing — add logging**. When a function takes 1.4ms but the Rust profiling shows 0.15ms, the gap is in the TS wrapper or napi proxy. Actually instrument rather than hypothesizing.
3. **Don't use throwaway `deno eval` scripts or `/tmp` files**. Write benchmark/profiling files in `packages/testing/benchmarks/` so they persist and can be re-run.
4. **Don't set environment variables in the shell command**. Set flags inside the script itself (e.g. `(globalThis as any).__TIDY_PROFILE = true`).
5. **Don't optimize only WASM when napi-rs + rayon is available**. The napi path should always be the primary optimization target since it's the one actually used in benchmarks.
6. **Don't assume algorithmic improvements (O(n) vs O(n log n)) dominate**. At 100K elements, the copy + function call overhead can dwarf the algorithm difference. Profile first.
7. **Use the existing benchmark infrastructure**. Don't create new benchmark scripts when `bench-local-stats.ts` and `bench-npm-tidy.ts` already exist.

---

## Goal
Close the gap between tidy-ts `arrange()` and Polars `sort()` at 500K rows.

## Baseline (before optimizations)

| Test | Polars | tidy-ts WASM | tidy-ts Native+Rayon |
|------|--------|-------------|---------------------|
| Numeric single col | 9.7ms | ~97ms | ~97ms |
| Numeric multi col | 13.5ms | ~120ms | ~184ms |
| String single col | 15.5ms | ~50ms | ~50ms |
| Mixed types multi col | 31.7ms | ~135ms | ~135ms |
| Grouped sort | 29.3ms | ~260ms | ~271ms |
| **Weighted avg** | **17.5ms** | **~100ms** | **~146ms** |

Native was actually **slower** than WASM because:
1. napi proxy passed `Int8Array` to a `Vec<i8>` parameter (type mismatch error silently caught → fell to slow JS path)
2. Once fixed, `Vec<u32>` return type created 500K individual JS Number objects

## Optimization 1: Rust algorithm improvements (WASM path)

Changes to `arrange.wasm.rs`:
- **Tuple sort**: Pack `(u32, f64)` pairs instead of sorting `Vec<usize>` indices with indirect lookups into `flat_cols`
- **NaN pre-partition**: Separate NaN values before sorting so the comparator never checks for NaN
- **Branchless total-order comparator**: `tot_cmp()` using bit manipulation (f64 → i64 sortable mapping) instead of `partial_cmp` + NaN branches
- **Multi-col: first key inline**: Primary sort key lives in the tuple for cache locality; tie-break columns use indirect access
- **Single-col fast path**: Dedicated `argsort_single_f64` with full NaN partition + tuple sort

### Pure Rust benchmark (standalone binary, no JS overhead)

| Approach | Serial | Rayon parallel |
|----------|--------|----------------|
| Old: sort indices (indirect) | 32.6ms | 8.6ms |
| New: tuple + NaN partition + tot_cmp | 14.5ms | **4.3ms** |
| Polars-style: sort dense f64 in place | 10.8ms | 3.7ms |

**Key finding**: Pure Rust sort is 4.3ms with rayon — faster than Polars's 18ms end-to-end (which includes DataFrame overhead).

### WASM results after optimization

| Test | Before | After | Improvement |
|------|--------|-------|-------------|
| Numeric single col | ~97ms | **23ms** | 4.2x |
| Numeric multi col | ~120ms | **44ms** | 2.7x |
| String single col | ~50ms | **17ms** | 2.9x |
| Mixed types multi col | ~135ms | **42ms** | 3.2x |
| Grouped sort | ~260ms | **259ms** | 1.0x (no change — TS overhead) |
| **Weighted avg** | **~100ms** | **64ms** | **1.6x** |

## Optimization 2: Fix napi proxy issues

### Issue 1: Int8Array → Vec<i8> type mismatch
The napi proxy passed `Int8Array` (TypedArray) to a Rust function expecting `Vec<i8>` (plain JS array).
**Fix**: Convert Int8Array/Int16Array/Int32Array to plain arrays in the proxy before calling napi.

### Issue 2: Vec<u32> return type (THE BIG ONE)
Returning `Vec<u32>` from napi creates a **JS Array of 500K individual Number objects**. This was the dominant cost.

| Runtime | Vec<u32> return | Uint32Array return |
|---------|----------------|-------------------|
| Node.js | **43ms** | **5ms** (8.6x faster) |

**Fix**: Changed all napi sort exports to return `Uint32Array::new(vec)` instead of `Vec<u32>`.

### Node.js results after both fixes

Raw napi sort (Node.js): **5ms** for 500K rows (was 43ms → was 128ms from Deno)

## Red herring: "Deno napi is slow"

Initial testing showed 128ms from Deno vs 5ms from Node.js for the same napi call.
**Root cause**: `pnpm napibuild` only copied the `.node` binary to `packages/dataframe/lib/` but NOT to `packages/npm-darwin-arm64/`. Deno's `createRequire` resolved `@tidy-ts/dataframe-darwin-arm64` to the npm package copy, which was stale (still returning `Vec<u32>` → 500K JS Number allocations).

**Fix**: Updated `napibuild` and `napibuild:debug` scripts in `package.json` to copy to both destinations.

After fix: Deno napi = 5ms, same as Node.js.

## Optimization 3: Grouped sort fast path

The old grouped sort path (`arrangeWasmStable`) was extremely slow because:
1. Linked-list traversal per group (`head[g]` → `next[row]` chain)
2. Per-group `Uint32Array` allocation
3. Per-group WASM/napi sort call (N calls for N groups)
4. Growing `number[]` one element at a time for the output
5. `result.toArray()` — materializes ALL rows to rebuild groups
6. `rebuildGroups()` — re-hashes all rows to rebuild adjacency list

**Fix**: For all-numeric grouped sorts, prepend group ID as column 0 in the flat buffer (ascending, keeps groups contiguous), append sort columns after it, sort everything in a **single** `arrange_multi_f64_wasm` call, then rebuild the adjacency list directly from the sorted output (no `toArray()`, no re-hashing).

Also fixed: NaN partition now sorts the NaN tail by original index to preserve null/undefined insertion order.

## Final state (2026-04-27)

Fresh benchmarks run simultaneously for fair comparison:

| Test | Polars | tidy-ts (native+rayon) | Ratio |
|------|--------|----------------------|-------|
| Numeric single col | 11.7ms | **11.5ms** | **0.98x** |
| Numeric multi col | 17.9ms | **18.0ms** | **1.0x** |
| String single col | 20.9ms | **16.2ms** | **0.77x** |
| Mixed types multi col | 39.2ms | **32.7ms** | **0.83x** |
| Grouped sort | 35.6ms | **39.6ms** | 1.11x |
| **Weighted avg** | **22.1ms** | **21.1ms** | **0.95x** |

**From 8.1x slower to 5% faster than Polars (weighted average) at 500K rows.**

## Summary of all changes

### Rust (`arrange.wasm.rs`)
- Tuple sort: `(u32, f64)` pairs for cache locality
- NaN pre-partition with stable NaN tail ordering
- Branchless `tot_cmp()` via f64→i64 bit mapping
- Multi-col: first key inline in tuple, tie-break indirect
- Single-col fast path: dedicated function with partition + tuple
- All napi exports return `Uint32Array` instead of `Vec<u32>`
- Rayon parallel sort on all napi paths

### TypeScript (`arrange.verb.ts`)
- Grouped numeric fast path: single sort call with group ID as primary key
- Direct adjacency list rebuild from sorted output (no `toArray()` / `rebuildGroups()`)

### Infrastructure
- `napibuild` copies `.node` to both `packages/dataframe/lib/` and `packages/npm-darwin-arm64/`
- napi proxy converts `Int8Array` → plain array for `Vec<i8>` parameters

---

# Join Optimization (2026-04-27)

## Baseline (before optimizations)

| Test | Polars | tidy-ts | Ratio |
|------|--------|---------|-------|
| Inner join (numeric key) | 7.6ms | 97ms | 12.8x |
| Left join (numeric key) | 10.6ms | 51ms | 4.8x |
| Inner join (string key) | 9.3ms | 119ms | 12.8x |
| Left join (string key) | 13.1ms | 55ms | 4.2x |
| Inner join (2-col key) | 10.8ms | 1374ms | **127x** |
| Left join (2-col key) | 16.7ms | 1310ms | **78x** |
| **Average** | **11.4ms** | **501ms** | **44x** |

## Root cause analysis

### Bug: IdentityHasher with packed u64 keys (THE BIG ONE)

The 2-col join was 127x slower because of a hash collision catastrophe.

For 2-col joins, keys are packed as `pack2_u64(a, b) = (a << 32) | b`. The `IdentityHasher` for u64 simply stored the raw value as the hash: `self.0 = i`. hashbrown uses the **low bits** for bucket selection.

With `id_a` in [0, 1000) and `id_b` in [0, 50), the low 32 bits of the packed u64 only had ~50 unique values (the `id_b` column). This caused massive bucket collisions in the hash map — all 100K right-side entries clustered into ~50 buckets instead of spreading across 50K.

**Fix**: Apply `mix64()` (splitmix64 finalizer) in `IdentityHasher::write_u64` to distribute bits properly.

**Result**: 2-col napi join: 6925ms → 25ms (277x improvement).

### TS overhead: Array.from() on Uint32Array

`inner-join.verb.ts` line 142-143 did `Array.from(wasmResult.takeLeft())` — converting Uint32Array to plain Array (same pattern as the Vec<u32> sort fix). This created ~1M Number objects for the join output.

### TS overhead: double indirection in result building

`buildJoinResult` computed `src[leftIndex[leftIndices[i]]]` — two array lookups per cell per output row. Fixed by precomputing physical indices once, then single indirection per cell.

### TS overhead: unnecessary materializeIndex

`getStoreAndIndex` called `materializeIndex(store.length, view)` which creates a 500K identity Uint32Array even for DataFrames with no view (empty `{}` view object). Fixed by checking `view.index || view.mask` and skipping the identity array allocation entirely.

### TS overhead: unnecessary view gather

For DataFrames without views, the `convertToTypedArrays` result can go directly to WASM without gathering through a view index.

## Changes

### Rust (`join-helpers.wasm.rs`)
- `IdentityHasher::write_u64`: apply `mix64()` instead of identity

### TypeScript (`inner-join.verb.ts`)
- Removed `Array.from()` on takeLeft/takeRight — keep Uint32Array
- Removed separate `buildJoinResult` function — inline with precomputed physical indices
- Detect identity view (`!view.index && !view.mask`) — skip `materializeIndex` and view gather
- Single indirection in column copy: `src[physIdx[i]]` instead of `src[viewIdx[joinIdx[i]]]`

### TypeScript (`left-join.verb.ts`)
- Same optimizations as inner join
- Added early return for empty right DataFrame (preserves left rows with undefined right columns)

## Final state (2026-04-27)

| Test | Polars | tidy-ts (before) | tidy-ts (after) | Improvement |
|------|--------|------------------|-----------------|-------------|
| Inner join (numeric) | 7.6ms | 97ms | **40ms** | 2.4x |
| Left join (numeric) | 10.6ms | 51ms | **46ms** | 1.1x |
| Inner join (string) | 9.3ms | 119ms | **61ms** | 2.0x |
| Left join (string) | 13.1ms | 55ms | **89ms** | — |
| Inner join (2-col) | 10.8ms | 1374ms | **49ms** | **28x** |
| Left join (2-col) | 16.7ms | 1310ms | **57ms** | **23x** |
| **Average** | **11.4ms** | **501ms** | **57ms** | **8.8x** |

**From 44x slower to 5x slower than Polars. 2-col joins from 127x slower to 4.5x slower.**

Remaining gap is mostly irreducible TS overhead:
- `convertToTypedArrays` hash encoding (~5ms per side)
- `new Array(n)` allocation + per-element copy for result columns (~10ms per column)
- Polars operates on Arrow columnar memory with zero-copy; tidy-ts copies through JS arrays

All 141 join tests pass.

---

# Rayon Parallel Join Probing (2026-04-28)

## Motivation

Profiling showed the Rust hash join (probe phase) was the dominant cost at ~31ms for a 500K × 100K
inner join, with JS overhead (convertToTypedArrays + column gather) accounting for only ~15ms.
The probe phase iterates all left rows against the right-side hash map — embarrassingly parallel.

## Approach: f64 fast path (abandoned)

First tried using `inner_join_gather_f64` / `left_join_gather_f64` which does join+gather entirely
in Rust, leveraging Float64Array columnar storage. Result: **no improvement** — the f64 hash join
uses 64-bit key hashing (`to_bits()` + `mix64()`), which is slower than the u32 path's 32-bit
identity hash. The f64 path was 40ms vs u32 path's 38ms despite eliminating JS gather.

## Approach: rayon parallel probing (implemented)

Added rayon parallelism to the napi join kernels (inner + left, all column counts):

1. **Build phase** (serial): Build CSR hash map from right-side keys (single pass, not parallelizable)
2. **Parallel sizing**: `left.par_iter()` counts matches per left row via hash map lookups
3. **Serial prefix sum**: Compute output offsets from counts
4. **Parallel fill**: Each left row writes to its non-overlapping output region via `RawSlice` (raw pointer wrapper with Send+Sync)

WASM path stays serial (no threads). Only napi path gets rayon.

### Safety

The parallel fill uses `RawSlice` — a raw `*mut u32` pointer wrapper marked `Send+Sync`.
Safety is guaranteed by the offset table: each left row `i` writes exclusively to
`offsets[i]..offsets[i+1]`, which are non-overlapping by construction from the prefix sum.

## Changes

### Rust (`inner-join.wasm.rs`)
- Added `RawSlice` helper (pub, used by left-join too)
- Added `inner_join_1col_par`, `inner_join_2col_par`, `inner_join_multi_par`
- Added `inner_join_dispatch_par` — napi export now uses parallel dispatch

### Rust (`left-join.wasm.rs`)
- Added `left_join_1col_par`, `left_join_2col_par`, `left_join_multi_par`
- Added `left_join_dispatch_par` — napi export now uses parallel dispatch

### TypeScript
- No changes needed — same u32 path, Rust is just faster

## Results

Profiled breakdown (500K × 100K, numeric key, ~1M output rows):

| Phase | Before rayon | After rayon |
|-------|-------------|-------------|
| convertToTypedArrays | 1.7ms | 1.5ms |
| **Rust hash join** | **30.8ms** | **10.7ms** |
| JS column gather | 13.1ms | 13.1ms |
| **End-to-end** | **38ms** | **18ms** |

Benchmark (500K left × 100K right, 50K unique keys, median of 5 runs):

| Test | Before rayon | After rayon | Improvement |
|------|-------------|-------------|-------------|
| Inner join (numeric) | 38ms | **20ms** | 1.9x |
| Left join (numeric) | 38ms | **23ms** | 1.7x |
| Inner join (string) | 57ms | **33ms** | 1.7x |
| Left join (string) | 53ms | **35ms** | 1.5x |
| Inner join (2-col) | 38ms | **49ms** | — |
| Left join (2-col) | 78ms | **60ms** | 1.3x |
| **Average** | **50ms** | **37ms** | **1.4x** |

Note: 2-col inner join shows variance; the rayon overhead for key packing may offset gains
at this scale. String join improvements come from parallel sizing despite serial hash encoding.

All 1153 dataframe tests pass, including all 121 join tests.

---

# Polars vs tidy-ts Join Audit (2026-04-28)

Full architectural comparison against Polars source (`polars-main/crates/polars-ops/src/frame/join/`).

## Head-to-head comparison at time of audit

| Test | Polars | tidy-ts | Ratio |
|------|--------|---------|-------|
| Inner join (numeric) | 8.9ms | 19.5ms | 2.2x |
| Left join (numeric) | 13.2ms | 22.3ms | 1.7x |
| Inner join (string) | 9.9ms | 34.8ms | 3.5x |
| Left join (string) | 12.5ms | 34.2ms | 2.7x |
| Inner join (2-col) | 10.1ms | 57.8ms | 5.7x |
| Left join (2-col) | 16.1ms | 35.2ms | 2.2x |
| **Average** | **11.8ms** | **34.0ms** | **2.9x** |

## 1. Hash Map & Hash Function

| Aspect | Polars | tidy-ts | Gap |
|--------|--------|---------|-----|
| Hash map | `hashbrown::HashMap` | `std::collections::HashMap` | hashbrown is ~20-30% faster (SIMD probing, better cache behavior) |
| Hasher (build) | `foldhash::quality::RandomState` | `IdentityHasher` (u32 identity, u64 mix64) | tidy-ts uses identity hash which is faster for well-distributed keys, but foldhash handles all distributions safely |
| Partition hash | `DirtyHash`: `key.wrapping_mul(0x55fbfd6bfc5458e9)` high bits | N/A — no partitioning | See parallelism section |
| Value type | `IdxVec` (inline first element, heap only for 2+ dupes) | `Off { start, len, next }` (CSR adjacency list) | CSR is good for sequential access; IdxVec avoids allocation for unique keys |

**Key finding**: Our CSR approach is actually solid for join workloads with many duplicates. The bigger issue is that we use `std::collections::HashMap` instead of `hashbrown`. Switching to hashbrown with a quality hasher would give us ~20-30% on the build phase.

## 2. Key Encoding

| Aspect | Polars | tidy-ts | Gap |
|--------|--------|---------|-----|
| Single numeric key | Direct value as hash map key (via `ToTotalOrd` trait) | JS: `convertToTypedArrays` polynomial hash → u32; Rust: u32 identity key | **Major gap**: tidy-ts double-hashes — JS hashes to u32, then Rust hashes the u32. Polars hashes once. |
| Two-col key | Row-encoded binary (via `polars-row::convert_columns`) | `pack2_u64(a << 32 \| b)` then `mix64` | tidy-ts packing is fine for 2 cols |
| Multi-col key | Row-encoded binary → single `BytesHash` with pre-computed u64 | `hash_row_multi`: XOR chain with `mix64` per column | tidy-ts hash quality may suffer from XOR symmetry |
| String key | XXH3-64 (hardware-accelerated, ~0.3 cycles/byte) | JS polynomial hash: `hash = hash * 31 + charCode` (31-bit, ~3+ cycles/byte) | **Major gap**: ~10x slower string hashing in JS |
| Float handling | `TotalOrdWrap<f64>` (canonicalizes NaN/signed zero) | `Math.round(num * 1000) >>> 0` — quantizes to integer! | **Major gap**: tidy-ts loses precision — values differing by < 0.001 collide |

**Key findings**:
1. **String hashing is ~10x slower** — JS polynomial hash vs XXH3. This explains the 3.5x gap on string joins.
2. **Numeric encoding quantizes** — `Math.round(num * 1000)` loses precision. Two values 99.9994 and 99.9996 hash to the same u32. This is a correctness risk.
3. **Double hashing overhead** — JS hashes column values → u32, then Rust uses u32 as hash map key. Polars hashes once in Rust.

## 3. Parallelism: Build Phase

| Aspect | Polars | tidy-ts | Gap |
|--------|--------|---------|-----|
| Strategy | **Partitioned parallel build**: scatter keys to N partitions by DirtyHash, then each thread builds one partition's hash table | **Serial build**: single-thread 3-pass CSR construction | **Major gap** |
| Implementation | 4 phases: (1) parallel partition counting, (2) serial prefix sum, (3) parallel scatter via `SyncPtr`, (4) per-partition parallel `PlHashMap` insert | 3 passes: (1) count per key, (2) prefix sum, (3) fill adjacency | Polars parallelizes the heaviest phase (hash table insert) |
| Thread count | `n_partitions = n_threads` (typically 8-16) | N/A | |

**Key finding**: Polars parallelizes hash table construction by partitioning keys first, then building one hash table per partition in parallel. Our build phase is entirely serial. For 100K right-side rows this is ~2-3ms, but it's a constant overhead that could be halved.

## 4. Parallelism: Probe Phase

| Aspect | Polars | tidy-ts | Gap |
|--------|--------|---------|-----|
| Strategy | Each thread probes its partition's hash table from the partitioned probe vector | `left.par_iter()` probes the single hash table | Similar approach, different granularity |
| Result collection | Thread-local `Vec<(IdxSize, IdxSize)>` → parallel flatten via `SyncPtr` + `copy_nonoverlapping` | Parallel sizing → prefix sum → parallel fill via `RawSlice` | Similar — both use offset-based parallel writes |
| Flatten | `std::ptr::copy_nonoverlapping` (memcpy) for contiguous thread-local results | Per-element `RawSlice::write()` in inner loop | **Gap**: Polars copies contiguous blocks; tidy-ts writes one element at a time |

**Key finding**: The probe phases are architecturally similar. The main difference is that Polars' partitioned approach gives better cache locality (each thread's probe keys map to one partition's hash table). Our approach has all threads hitting the same hash table, causing cache contention. The flatten step could also benefit from block copies.

## 5. Column Gather / Materialization

| Aspect | Polars | tidy-ts | Gap |
|--------|--------|---------|-----|
| Strategy | `apply_columns_par()` — parallel gather across columns via Rayon | Serial JS loops: `for (i=0; i<n; i++) dst[i] = src[idx[i]]` | **Major gap**: Polars parallelizes across columns; tidy-ts is single-threaded JS |
| Primitive gather | `unsafe { *values.get_unchecked(*idx as usize) }` with `collect_trusted()` | `dst[i] = src[leftPhys[i]]` (bounds-checked JS) | Rust unchecked + compiler auto-vectorization vs JS bounds-checked |
| String gather | Gathers 16-byte views only, shares data buffers via Arc | Copies full string references in `new Array(n)` | Polars avoids copying string data entirely |
| Memory | Zero-copy Arrow arrays, pre-allocated | `new Float64Array(n)` or `new Array(n)` per column | Similar pre-allocation, but JS has GC pressure |
| Time cost | Near-zero (included in Polars benchmark) | ~13ms for 1M output rows (6 columns) | This is ~35% of our total join time |

**Key finding**: Column gather is 100% JS overhead. For numeric columns, moving gather to Rust (pass Float64Array columns + index pairs, return gathered Float64Array columns) would eliminate ~13ms. This was attempted via the f64 fast path but abandoned because it used a slower hash function. The right approach: use the fast u32 hash join to get index pairs, then do gather in Rust on the original Float64Array columns.

## 6. String Key Handling

| Aspect | Polars | tidy-ts | Gap |
|--------|--------|---------|-----|
| Hash function | XXH3-64 with seed (hardware-accelerated) | JS: `hash = hash * 31 + charCode` (polynomial, 31-bit) | ~10x slower |
| Where hashing happens | Rust, during hash table build | JavaScript, before WASM/napi call (`convertToTypedArrays`) | Extra napi boundary crossing |
| Hash quality | 64-bit, near-perfect distribution | 31-bit, prone to collisions on long strings | Higher collision rate |
| Pre-computed hash | `BytesHash` stores u64 hash, avoids rehashing in HashMap | N/A — hashes to u32, then u32 used as key | Double work |

**Key finding**: Moving string hashing to Rust (pass string arrays via napi, hash with XXH3 or similar in Rust) would close most of the string join gap. Expected improvement: string joins from ~35ms to ~20ms.

## 7. JS-Side Overhead Budget

Breakdown of where time goes for a numeric inner join (500K × 100K, ~1M output):

| Phase | tidy-ts time | Polars equivalent | Notes |
|-------|-------------|-------------------|-------|
| `convertToTypedArrays` | ~1.5ms | 0ms (data already in Arrow) | JS polynomial hashing of values to u32 |
| napi call overhead | ~0.5ms | 0ms (all in Rust) | Function call + TypedArray wrapping |
| Rust hash join (probe) | ~10.7ms | ~5ms (estimated) | Our CSR probe vs partitioned probe |
| JS column gather | ~6-13ms | ~1ms (parallel Rust gather) | 6 columns × ~1M rows, serial JS loops |
| **Total** | **~19-26ms** | **~6ms** | |

Irreducible JS overhead: ~2ms (napi boundary + convertToTypedArrays).
Reducible overhead: ~11ms (column gather) + ~5ms (Rust hash join gap).

## 8. Ranked Action Items

Based on this audit, ranked by expected impact:

### Tier 1: High impact, moderate effort

1. **Move column gather to Rust** (~13ms → ~1ms)
   - After u32 hash join returns index pairs, pass original Float64Array/string columns to a Rust gather function
   - Return gathered columns as Float64Array
   - Expected: eliminate ~10-12ms of JS gather overhead

2. **Move string hashing to Rust** (~15ms → ~3ms for string joins)
   - Accept string arrays via napi, hash with XXH3 in Rust
   - Return u32/u64 keys for join, or do the entire join in Rust
   - Expected: string joins from ~35ms to ~20ms

3. **Switch to hashbrown** (~10.7ms → ~8ms for Rust join)
   - Replace `std::collections::HashMap` with `hashbrown::HashMap`
   - Use foldhash or keep identity hasher with hashbrown's SIMD probing
   - Expected: ~20-30% improvement on hash map operations

### Tier 2: Moderate impact, moderate effort

4. **Parallelize hash table build** (~2-3ms → ~1ms)
   - Partition right-side keys by DirtyHash, build per-partition hash tables in parallel
   - Requires restructuring CSR to partitioned layout

5. **Fix numeric key precision** (correctness)
   - `Math.round(num * 1000) >>> 0` quantizes floats — values within 0.001 collide
   - Should use `f64.to_bits()` or similar lossless encoding
   - This is a correctness bug, not just performance

6. **Block copy in flatten** (small speedup)
   - Replace per-element `RawSlice::write()` with `copy_nonoverlapping` for contiguous result blocks
   - Polars collects thread-local Vec then memcpy; we write one element at a time

### Tier 3: Lower impact or longer term

7. **Eliminate double hashing for numeric keys**
   - Currently: JS hashes value → u32, Rust uses u32 as key with identity hash
   - Better: pass raw f64 values to Rust, hash once with quality hasher
   - Blocked by: need Rust to accept Float64Array key columns directly

8. **IdxVec inline optimization**
   - Polars' IdxVec stores first match inline (no heap allocation for unique keys)
   - Our CSR always allocates the adjacency vector
   - Lower priority since CSR is good for high-duplicate workloads

9. **Cache-friendly partitioned probing**
   - Polars partitions probe keys so each thread's lookups hit one partition's table
   - Our approach has all threads hitting the same table → cache contention
   - Requires full architectural change to partitioned join

---

# npm Package Validation (2026-04-28)

## Purpose

Validate that `@tidy-ts/dataframe` on npm works correctly with the native napi-rs backend,
and compare end-to-end performance against Polars (Python) using identical operations.

## Scripts

- **tidy-ts benchmark**: [`bench-npm-tidy.ts`](bench-npm-tidy.ts) — run via `npx tsx bench-npm-tidy.ts`
- **Polars benchmark**: [`bench-npm-polars.py`](bench-npm-polars.py) — run via `python3 bench-npm-polars.py`

## Setup

- **tidy-ts**: `npm install @tidy-ts/dataframe`, run via `npx tsx bench-npm-tidy.ts`
- **Polars**: `python3 bench-npm-polars.py` (Polars 1.38.1, `POLARS_MAX_THREADS=4`)
- **Machine**: Apple M-series, macOS
- **Data**: 100K rows, randomly generated, same seed/shape for both
- **Method**: 20 iterations, 3 warmup, median reported

## Results (100K rows)

| Operation | tidy-ts (npm, native) | Polars (Python) | Ratio (tidy/polars) |
|---|---|---|---|
| **sum** | 11.0ms | 0.05ms | 220x |
| **mean** | 6.9ms | 0.02ms | 345x |
| **stdev** | 8.2ms | 0.08ms | 103x |
| **median** | 8.8ms | 0.33ms | 27x |
| **quantile(0.95)** | 7.9ms | 0.17ms | 46x |
| **filter (x > 50)** | 6.2ms | 0.16ms | 39x |
| **mutate (z = x+y)** | 1.6ms | 0.09ms | 18x |
| **arrange (x asc)** | 1.9ms | 3.7ms | **0.5x (tidy wins)** |
| **select (x, y)** | 0.007ms | 0.03ms | **0.2x (tidy wins)** |
| **groupBy+summarize** | 13.4ms | 1.1ms | 12x |
| **innerJoin (50K×10K)** | 3.4ms | 1.5ms | 2.2x |
| **leftJoin (50K×10K)** | 5.7ms | 1.6ms | 3.6x |

## Analysis

### Where tidy-ts wins
- **arrange**: 1.9ms vs 3.7ms. Our Rust+rayon sort with tuple packing and NaN pre-partition is faster than Polars at this scale. Consistent with the 500K results in the sort optimization section above.
- **select**: 0.007ms vs 0.03ms. Zero-copy view creation — tidy-ts just creates a new column name mapping, no data movement.

### Where tidy-ts is competitive (< 5x)
- **innerJoin**: 3.4ms vs 1.5ms (2.2x). After hashbrown + rayon parallel probing + Rust column gather, joins are within striking distance.
- **leftJoin**: 5.7ms vs 1.6ms (3.6x). Same architecture, slight extra cost for null-fill on unmatched left rows.
- **mutate**: 1.6ms vs 0.09ms (18x). JS callback overhead per row. Polars executes expressions entirely in Rust with SIMD.

### Where the gap is large (stats: 27-345x)
The stats gap is the dominant issue. Root cause:

1. **Column access overhead**: `s.sum(df.x)` goes through a JS Proxy getter → column extraction → TypedArray creation → WASM/napi call. Polars operates directly on Arrow columnar memory with zero indirection.
2. **Per-call overhead**: Each stat call (sum, mean, stdev) is a separate WASM/napi round-trip. Polars batches multiple aggregations into a single expression plan executed in Rust.
3. **No SIMD in WASM**: WASM sum/mean don't use SIMD intrinsics. Polars uses auto-vectorized Rust with AVX2/NEON.
4. **DataFrame overhead**: The benchmark accesses `df.x` which creates a column view each call. Polars' `pl.col('x').sum()` is a lazy expression compiled to a single Rust call with direct memory access.

### Context: 500K benchmarks tell a different story

The 100K npm benchmark above uses the public DataFrame API (`s.sum(df.x)`) which has significant JS overhead per call. The 500K benchmarks in the earlier sections of this log used lower-level WASM/napi calls directly and showed much better results:

| Operation | 500K benchmark (this log) | Ratio vs Polars |
|---|---|---|
| Sort (weighted avg) | 21.1ms | **0.95x (tidy wins)** |
| Inner join (numeric) | 20ms | 2.2x |
| Left join (numeric) | 23ms | 1.7x |

The Rust kernels themselves are competitive. The gap in the npm benchmark is dominated by JS-side overhead (proxy getters, column materialization, per-call dispatch).

## Stats Optimization Plan

### The overhead chain: what happens when you call `s.sum(df.x)`

Traced through the actual source code:

1. **`df.x` — Proxy getter** ([columnar-proxy.ts:100-146](../dataframe/ts/dataframe/implementation/columnar-proxy.ts))
   - Hits `buildColumnarProxyHandlers.get()` trap
   - Checks if `prop` is a column name via `currentStore.columnNames.includes(prop)` — O(n) string comparison
   - If no view: `columnData = col` (just a reference, fast)
   - **Creates a new frozen array**: `[...columnData]` — copies 100K elements every time
   - Adds a `.toArray()` method via `Object.defineProperty`
   - Calls `Object.freeze()` on the result
   - **Cost**: ~5-8ms for 100K rows (spread copy + freeze)

2. **`s.sum(values)` — stat function** ([sum.ts:79-153](../dataframe/ts/stats/aggregate/sum.ts))
   - Checks `typeof values === "number"` (false for array)
   - `Array.isArray(values)` check (true — uses processArray directly)
   - Calls `canUseFastPath(processArray, options)` which calls `isAllFiniteNumbers()` — iterates all 100K elements checking `typeof v !== "number" || !Number.isFinite(v)`
   - If fast path: checks `processArray.length >= 1 << 15` (32768) — true for 100K
   - Creates `new Float64Array(processArray)` — **another 100K copy** from frozen array to typed array
   - Calls `sum_wasm(Float64Array)` — the actual WASM/napi call
   - **Cost**: ~3-5ms (isAllFiniteNumbers scan + Float64Array copy + WASM call)

**Total per stat call: ~8-13ms**, of which the actual WASM sum is <0.1ms.

For `s.stdev(df.x)`, it's worse: `sd()` → `variance()` → two `.reduce()` passes over the array (no WASM fast path for variance/stdev).

### Where the time goes (estimated breakdown for `s.sum(df.x)` on 100K rows)

| Phase | Time | Notes |
|-------|------|-------|
| Proxy getter: `[...columnData]` spread copy | ~3ms | Copies 100K elements into new array |
| Proxy getter: `Object.freeze()` | ~2ms | Freezes 100K-element array |
| `isAllFiniteNumbers()` scan | ~1ms | Iterates 100K checking typeof + isFinite |
| `new Float64Array(processArray)` | ~2ms | Copies 100K from JS array to typed array |
| Actual WASM/napi `sum_wasm()` | <0.1ms | The actual computation |
| **Total** | **~8ms** | 99% is JS overhead |

### Optimization tiers

#### Tier 1: Eliminate redundant copies (expected: 8ms → <1ms per stat call)

**1a. Cache column arrays on the Proxy**

The Proxy getter currently creates a fresh `[...columnData]` + `Object.freeze()` on every access. Instead:
- Cache the frozen array on first access per column
- Invalidate cache when `__store` changes (mutate, filter, etc.)
- This alone eliminates ~5ms per stat call

**1b. Skip `isAllFiniteNumbers` for cached clean columns**

Store a `cleanFlags` map on the ColumnarStore. When a column is first validated as all-finite-numbers, mark it. On subsequent stat calls, skip the O(n) scan.

**1c. Store column data as Float64Array internally**

If `ColumnarStore.columns[name]` stored a `Float64Array` (not `number[]`), we could pass it directly to WASM/napi without the `new Float64Array(processArray)` copy. This is the single biggest optimization — it eliminates both the spread copy and the typed array construction.

Combined effect: `s.sum(df.x)` would become: cache hit (0ms) → already-validated flag (0ms) → pass existing Float64Array to WASM (0ms copy) → WASM sum (<0.1ms).

#### Tier 2: Batch multiple stats in one Rust call (expected: further 3-5x for summarize)

Currently `df.groupBy("g").summarize({ sum: g => s.sum(g.x), mean: g => s.mean(g.y) })` makes separate stat calls per group per aggregation. Instead:

- Add a Rust `batch_stats(columns: Float64Array[], ops: string[])` napi function
- Accepts multiple columns + operation names, returns all results in one call
- For grouped operations, pass group indices + columns, compute all aggregations in one Rust pass with Rayon parallelism across groups

#### Tier 3: Variance/stdev WASM fast path (expected: stdev from ~8ms to <0.5ms)

Currently `variance()` uses two JS `.reduce()` passes — no WASM acceleration at all. Add:
- `variance_wasm(Float64Array)` and `stdev_wasm(Float64Array)` Rust functions
- Use Welford's online algorithm or two-pass with SIMD
- Wire into the fast path in `variance.ts` and `stdev.ts`

### Expected impact

| Operation | Current | After Tier 1 | After Tier 1+2+3 | Polars |
|-----------|---------|-------------|------------------|--------|
| sum | 11.0ms | <0.5ms | <0.5ms | 0.05ms |
| mean | 6.9ms | <0.5ms | <0.5ms | 0.02ms |
| stdev | 8.2ms | ~2ms (still JS reduce) | <0.5ms | 0.08ms |
| median | 8.8ms | <1ms | <0.5ms | 0.33ms |
| groupBy+summarize | 13.4ms | ~5ms | ~1ms | 1.1ms |

Tier 1 alone should bring stats within 5-10x of Polars. With all three tiers, we should be within 2-5x for individual stats and competitive on grouped summarize.

---

# Stats Optimization Results (2026-04-28)

## Changes

### Rust

- **`quantile-core.wasm.rs`**: Added `tot_cmp` (branchless total-order comparator from arrange), clean-data fast path (skips `filter(is_finite).collect()` when all values are finite), and O(n) quickselect via `select_nth_unstable_by` for single-quantile Type 7 calls.
- **`quantile.wasm.rs`**: Added `quantile_type7_select()` — standalone quickselect for Type 7. NAPI export uses quickselect for single prob, rayon `par_sort_unstable_by` for multi-prob. Skips NaN filter when data is all-finite.
- **`median.wasm.rs`**: NAPI export uses `quantile_type7_select(&mut buf, 0.5)` directly instead of going through the generic `quantile()` function.
- **`variance.wasm.rs`**: Two-pass variance/stdev in Rust (WASM + napi). Batch stats function for summarize.
- **`sum.wasm.rs`**: Already had WASM/napi exports; unchanged.

### TypeScript

- **`columnar-proxy.ts`**: Column cache with `__typedArray` non-enumerable property. Cache keyed by column name, invalidated when store/view changes. Float64Array columns attach original typed array for zero-copy stats.
- **`helpers.ts`**: `getTypedArray()` extracts Float64Array from `instanceof` check or `__typedArray` property.
- **`sum.ts`, `mean.ts`, `variance.ts`, `stdev.ts`, `median.ts`, `quantile.ts`**: All have Float64Array fast path via `getTypedArray()` — skips `isAllFiniteNumbers` scan and `new Float64Array()` copy.

## Results (100K rows, Deno, native napi-rs backend)

| Operation | Before | After | Polars | Before ratio | **After ratio** |
|-----------|--------|-------|--------|-------------|----------------|
| **sum** | 11.0ms | **0.107ms** | 0.074ms | 220x | **1.4x** |
| **mean** | 6.9ms | **0.102ms** | 0.023ms | 345x | **4.4x** |
| **stdev** | 8.2ms | **0.202ms** | 0.072ms | 103x | **2.8x** |
| **median** | 8.8ms | **0.364ms** | 0.322ms | 27x | **1.1x** |
| **quantile(0.95)** | 7.9ms | **0.217ms** | 0.164ms | 46x | **1.3x** |
| **groupBy+summarize** | 13.4ms | **3.024ms** | 0.676ms | 12x | **4.5x** |
| filter | 6.2ms | 6.4ms | 0.13ms | 39x | 49x |
| mutate | 1.6ms | 1.6ms | 0.07ms | 18x | 23x |
| **arrange** | 1.9ms | 1.3ms | 2.5ms | **0.5x** | **0.5x** |
| **select** | 0.007ms | 0.007ms | 0.049ms | **0.14x** | **0.14x** |
| innerJoin | 3.4ms | 1.7ms | 0.6ms | 2.2x | 2.8x |
| leftJoin | 5.7ms | 1.8ms | 0.9ms | 3.6x | 1.9x |

## Summary

Stats went from **27-345x slower** to **1.1-4.5x slower** than Polars.

- **sum**: 220x → 1.4x (103x improvement)
- **median**: 27x → 1.1x (near parity with Polars)
- **quantile**: 46x → 1.3x (near parity with Polars)
- **stdev**: 103x → 2.8x
- **groupBy+summarize**: 12x → 4.5x

The optimizations eliminated ~99% of JS overhead via column caching + Float64Array pass-through, and replaced O(n log n) sort with O(n) quickselect for single-quantile/median calls in the napi path.

All 1153 dataframe tests pass.

---

# Anti-Pattern Cleanup & Standardization (2026-04-28)

Prep work before per-operation optimization sprints.

## 1. Consolidated duplicated `quantile_type7_select`

**Problem**: Same quickselect algorithm implemented twice:
- `quantile-core.wasm.rs`: `quantile_type7_quickselect()` using `tot_cmp` (branchless total-order)
- `quantile.wasm.rs`: `quantile_type7_select()` using `partial_cmp().unwrap()`

Both are safe (callers always filter non-finite values first), but having two copies meant changes to one didn't propagate.

**Fix**: Single canonical `pub(crate) fn quantile_type7_select()` in `quantile-core.wasm.rs`. Uses `partial_cmp().unwrap()` (safe after NaN filtering, slightly faster than `tot_cmp` since no bit manipulation). Both `quantile.wasm.rs` and `median.wasm.rs` now import from `quantile_core`. Removed `tot_cmp` from quantile-core entirely (it remains in `arrange.wasm.rs` where NaN values are present pre-partition).

## 2. Created standardized verb helpers (`column-helpers.ts`)

**Problem**: Every verb reinvented column access + view handling + scatter-gather differently. No standard pattern for preparing data for WASM or building result stores.

**Fix**: Added three helpers to `packages/dataframe/ts/dataframe/implementation/column-helpers.ts`:

- `getColumnAsFloat64(store, colName, view?)` — Get column as Float64Array ready for WASM, gathering through view if needed. Returns null for non-numeric columns.
- `gatherColumn(col, indices)` — Gather a single column through Uint32Array index. Preserves Float64Array type.
- `buildStoreFromIndices(source, indices, columnNames?)` — Build a new ColumnarStore by scatter-gathering all columns at given indices. Replaces inline loops in distinct, joins, bind-rows.

## 3. Fixed `__typedArray` not attached to group column extractions

**Problem**: In `summarise.verb.ts`, group columns were extracted into plain `new Array(groupSize)` with only `VALIDATED_ARRAY` symbol set. Stat functions couldn't use the WASM fast path (`getTypedArray()` returned null), falling back to JS loops for all group sizes.

**Fix**: For Float64Array source columns, group extraction now:
1. Gathers into `new Float64Array(groupSize)`
2. Wraps as `Array.from(gathered)` with `__typedArray` property attached
3. Stat functions now hit WASM/napi fast path for ALL group sizes (not just > 32K)

Expected impact: grouped summarize stats calls go from JS-loop to WASM for every group.

## 4. Verified unused Rust functions ready for integration

Confirmed signatures match what verbs need:

| Function | Signature | Integration path |
|----------|-----------|-----------------|
| `reduce_sum_f64` | `(gid_per_row: &[u32], vals: &[f64], n_groups: u32) -> Vec<f64>` | Convert adjacency list to flat `gid_per_row` array, pass column Float64Array |
| `reduce_mean_f64` | `(gid_per_row: &[u32], vals: &[f64], valid: &[u8], n_groups: u32) -> Vec<f64>` | Same + validity mask for NaN handling |
| `reduce_count_u32` | `(gid_per_row: &[u32], valid: &[u8], n_groups: u32) -> Vec<u32>` | Count per group |
| `group_ids_codes_all` | `(keys_codes: &[u32], n_rows: usize, n_key_cols: usize) -> Grouping` | Replace JS Map hashing in group-by.verb.ts |
| `pivot_longer_dense` | `(keep: &[u32], fold: &[f64], names: &[u32], n_rows, n_keep, n_fold) -> PivotLongerResult` | Dictionary-encode keep cols, pass Float64Array fold cols |

Key prerequisite for `reduce_*`: compute `gid_per_row` from adjacency list:
```typescript
const gidPerRow = new Uint32Array(n);
for (let g = 0; g < G; g++) {
  let row = head[g];
  while (row !== -1) { gidPerRow[row] = g; row = next[row]; }
}
```

## Validation

- WASM build: passes
- napi build: passes
- Type check (`pnpm check:dataframe`): 0 errors
- All 1153 dataframe tests: pass

---

# Bulk Reduce Descriptors for Grouped Summarize (2026-04-28)

## Problem

Grouped summarize (`df.groupBy("g").summarize({ total: g => s.sum(g.x) })`) iterates G groups and makes G separate WASM/napi calls — one per group per aggregation. At 100K rows with 1000 groups, this means 1000 WASM round-trips for a single sum.

The Rust `reduce_sum_f64`, `reduce_mean_f64`, and `reduce_count_u32` functions already exist and process ALL groups in a single vectorized pass via a flat `gid_per_row` array. They were never wired into summarize.

## Solution

Added **descriptor-based** aggregation API alongside the existing lambda API:

```typescript
import { createDataFrame, sumOf, meanOf, countOf } from "@tidy-ts/dataframe";

// New descriptor API (bulk path — 1 WASM call per operation):
const result = df
  .groupBy("region")
  .summarize({
    total: sumOf("revenue"),
    avg: meanOf("revenue"),
    n: countOf(),
  });

// Existing lambda API still works (per-group path — G WASM calls):
const result2 = df
  .groupBy("region")
  .summarize({
    total: g => s.sum(g.revenue),
    avg: g => s.mean(g.revenue),
    n: g => g.nrows(),
  });

// Mixed mode also works (descriptors use bulk, lambdas use per-group):
const result3 = df
  .groupBy("region")
  .summarize({
    total: sumOf("revenue"),
    custom: g => s.median(g.revenue),  // no bulk path for median yet
  });
```

## Implementation

### New file: `packages/dataframe/ts/stats/aggregate/reduce-descriptors.ts`
- `sumOf(column)` → `{ __reduceOp: "sum", column }`
- `meanOf(column)` → `{ __reduceOp: "mean", column }`
- `countOf(column?)` → `{ __reduceOp: "count", column }` (null = count all rows)
- `isReduceDescriptor()` type guard

### Modified: `packages/dataframe/ts/verbs/aggregate/summarise.verb.ts`
- **Pure descriptor path**: When ALL spec entries are descriptors:
  1. Build `gid_per_row: Uint32Array[n]` from adjacency list (O(n) single pass)
  2. Call `reduce_sum_f64` / `reduce_mean_f64` / `reduce_count_u32` once each
  3. Build result DataFrame directly from bulk outputs — no per-group iteration at all
- **Mixed mode**: Pre-compute descriptor columns in bulk, inject into per-group loop
- Falls back to per-group path for non-Float64Array columns

### Modified: `packages/dataframe/ts/verbs/aggregate/summarise.types.ts`
- `SummaryEntry<Row>` accepts both `(group) => value` and `ReduceDescriptor`

### Exported from package
- `sumOf`, `meanOf`, `countOf` exported from `mod.ts` and `ts/index.ts`

## Expected Performance Impact

For pure descriptor specs, the bulk path eliminates:
- G adjacency list walks (replaced by 1 walk to build `gid_per_row`)
- G proxy DF constructions
- G × K WASM round-trips (replaced by K total calls, one per aggregation column)
- G × K column gather + `Array.from()` + `__typedArray` attachment

For 1000 groups with 3 aggregations: 3000 WASM calls → 3 WASM calls.

## Validation

- Type check (`pnpm check:dataframe`): 0 errors
- All 1163 dataframe tests pass (10 new + 1153 existing)
- New tests cover: sum/mean/count equivalence with lambda path, NaN handling, all-NaN columns, multiple grouping keys, empty data, mixed descriptor+lambda mode
