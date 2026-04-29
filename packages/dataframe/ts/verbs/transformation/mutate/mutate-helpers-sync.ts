// deno-lint-ignore-file no-explicit-any
import {
  cowStore,
  createColumnarDataFrameFromStore,
  createDataFrame,
  materializeIndex,
  preserveDataFrameMetadata,
} from "../../../dataframe/index.ts";
import type { DataFrame, GroupedDataFrame } from "../../../dataframe/index.ts";
import type { MutateAssignments } from "./mutate.types.ts";
import {
  mutate_binary_cols,
  mutate_col_scalar,
  mutate_compare_scalar_raw,
  mutate_compare_cols_raw,
  mutate_fill_scalar,
} from "../../../wasm/sorting-functions.ts";

/* =================================================================================
   Synchronous helper functions for mutate operations
   ================================================================================= */

/**
 * Create a new DataFrame with updated columns using copy-on-write
 */
export function createUpdatedDataFrame<Row extends Record<string, unknown>>(
  df: DataFrame<Row> | GroupedDataFrame<Row>,
  updates: Record<string, unknown[]>,
  drops?: Set<string>,
): any {
  const profile = (globalThis as any).__TIDY_PROFILE;
  const api = df as any;
  const store = api.__store;

  // Build copy-on-write store
  let t0 = profile ? performance.now() : 0;
  const nextStore = cowStore(store, updates, drops);
  if (profile) console.log(`    [createUpdatedDF] cowStore: ${(performance.now() - t0).toFixed(4)}ms`);

  // Create new DataFrame directly from store (includes Proxy + RowView)
  t0 = profile ? performance.now() : 0;
  const out = createColumnarDataFrameFromStore(nextStore);
  (out as any).__view = api.__view; // preserve view
  if (profile) console.log(`    [createUpdatedDF] createFromStore: ${(performance.now() - t0).toFixed(4)}ms`);

  // Preserve DataFrame metadata (__kind, __groups, __rowLabels)
  t0 = profile ? performance.now() : 0;
  preserveDataFrameMetadata(out, df);
  if (profile) console.log(`    [createUpdatedDF] preserveMetadata: ${(performance.now() - t0).toFixed(4)}ms`);

  return out;
}

/**
 * Process grouped data mutations
 */
export function processGroupedMutations<Row extends Record<string, unknown>>(
  df: DataFrame<Row> | GroupedDataFrame<Row>,
  spec: MutateAssignments<Row>,
  updates: Record<string, unknown[]>,
): void {
  const profile = (globalThis as any).__TIDY_PROFILE;
  let t1 = profile ? performance.now() : 0;
  const api = df as any;
  const row = api.__rowView as any;
  const store = api.__store;
  const g = (df as any).__groups;
  const view = api.__view;
  const storeLength = store.length;
  if (profile) console.log(`    [groupedMutate] setup(store/view/groups): ${(performance.now() - t1).toFixed(4)}ms`);

  const isIdentity = !view?.mask && !view?.rawMask && !view?.index;
  let _materialized: Uint32Array | null = null;
  const getMaterialized = () => {
    if (!_materialized) {
      t1 = profile ? performance.now() : 0;
      _materialized = materializeIndex(storeLength, view);
      if (profile) console.log(`    [groupedMutate] materializeIndex(${storeLength}→${_materialized.length}): ${(performance.now() - t1).toFixed(4)}ms`);
    }
    return _materialized;
  };
  // Eagerly materialize only when we know we need it (non-identity view)
  if (!isIdentity) getMaterialized();

  const usesRaw = !!g?.usesRawIndices;

  for (const [col, expr] of Object.entries(spec)) {
    if (expr === null) {
      continue;
    }

    let t0 = profile ? performance.now() : 0;
    if (typeof expr === "function") {
      // Try columnar fast path first — works regardless of grouping
      // since grouped mutate with r => r.x + r.y doesn't depend on group context
      const len = isIdentity ? storeLength : getMaterialized().length;
      const idx = isIdentity ? null : getMaterialized();
      if (!updates[col]) updates[col] = new Array(storeLength);
      let _tc = profile ? performance.now() : 0;
      const columnar = tryColumnarMutate(expr, store, col, updates, len, idx, null, profile);
      if (profile) console.log(`    [groupedMutate] tryColumnarMutate("${col}"): ${(performance.now() - _tc).toFixed(4)}ms, result=${columnar}`);
      if (columnar) continue;

      // Check if the function uses the 3rd arg (groupDF)
      _tc = profile ? performance.now() : 0;
      const fnStr = String(expr);
      const fnParams = /^\(?([^)]*)\)?\s*=>/.exec(fnStr);
      const paramCount = fnParams ? fnParams[1].split(",").length : 0;
      const usesGroupDF = paramCount >= 3;
      if (profile) console.log(`    [groupedMutate] fnStr parse: ${(performance.now() - _tc).toFixed(4)}ms, usesGroupDF=${usesGroupDF}, paramCount=${paramCount}`);

      const { head, next, size } = g;

      if (usesGroupDF) {
        // Full path: build group DataFrame for 3rd argument
        for (let groupIdx = 0; groupIdx < size; groupIdx++) {
          const groupRows: Record<string, unknown>[] = [];
          let tempRowIdx = head[groupIdx];

          while (tempRowIdx !== -1) {
            const groupRow: Record<string, unknown> = {};
            const physicalIndex = usesRaw
              ? tempRowIdx
              : getMaterialized()[tempRowIdx];
            for (const colName of store.columnNames) {
              groupRow[colName] = store.columns[colName][physicalIndex];
            }
            groupRows.push(groupRow);
            tempRowIdx = g.next[tempRowIdx];
          }

          const groupDF = createDataFrame(groupRows);

          let k = 0;
          let rowIdx = head[groupIdx];
          while (rowIdx !== -1) {
            const physicalIndex = usesRaw ? rowIdx : getMaterialized()[rowIdx];
            row.setCursor(physicalIndex);
            updates[col][physicalIndex] = (expr as any)(row, k, groupDF);
            k++;
            rowIdx = next[rowIdx];
          }
        }
        if (profile) console.log(`    [groupedMutate] fn col "${col}"(${storeLength} rows, ${size} groups, fullGroupDF): ${(performance.now() - t0).toFixed(4)}ms`);
      } else {
        // Fast path: just use RowView cursor, skip groupDF construction
        let _tLoop = profile ? performance.now() : 0;
        let _setCursorTotal = 0;
        let _fnCallTotal = 0;
        let _rowCount = 0;
        for (let groupIdx = 0; groupIdx < size; groupIdx++) {
          let k = 0;
          let rowIdx = head[groupIdx];
          while (rowIdx !== -1) {
            const physicalIndex = usesRaw ? rowIdx : getMaterialized()[rowIdx];
            if (profile) { const _ts = performance.now(); row.setCursor(physicalIndex); _setCursorTotal += performance.now() - _ts; }
            else row.setCursor(physicalIndex);
            if (profile) { const _tf = performance.now(); updates[col][physicalIndex] = (expr as any)(row, k); _fnCallTotal += performance.now() - _tf; }
            else updates[col][physicalIndex] = (expr as any)(row, k);
            k++;
            _rowCount++;
            rowIdx = next[rowIdx];
          }
        }
        if (profile) {
          console.log(`    [groupedMutate] cursor loop(${_rowCount} rows, ${size} groups): ${(performance.now() - _tLoop).toFixed(4)}ms`);
          console.log(`      [groupedMutate] setCursor total: ${_setCursorTotal.toFixed(4)}ms`);
          console.log(`      [groupedMutate] fn call total: ${_fnCallTotal.toFixed(4)}ms`);
          console.log(`    [groupedMutate] fn col "${col}"(${storeLength} rows, ${size} groups, cursorOnly): ${(performance.now() - t0).toFixed(4)}ms`);
        }
      }
    } else if (Array.isArray(expr)) {
      const n = (df as DataFrame<Row>).nrows();
      if (expr.length !== n) {
        throw new Error(
          `Array length mismatch for column "${col}": provided ${expr.length} values but DataFrame has ${n} rows. ` +
            `Array values must match the number of rows in the DataFrame.`,
        );
      }
      if (!updates[col]) updates[col] = new Array(storeLength);
      // Map array values to physical indices respecting the view
      const idx = getMaterialized();
      for (let i = 0; i < idx.length; i++) updates[col][idx[i]] = expr[i];
      if (profile) console.log(`    [groupedMutate] array col "${col}"(${storeLength} rows): ${(performance.now() - t0).toFixed(4)}ms`);
    } else {
      if (!updates[col]) updates[col] = new Array(storeLength);
      // Apply scalar to visible rows only, respecting the view
      const idx = getMaterialized();
      for (let i = 0; i < idx.length; i++) updates[col][idx[i]] = expr;
      if (profile) console.log(`    [groupedMutate] scalar col "${col}"(${storeLength} rows): ${(performance.now() - t0).toFixed(4)}ms`);
    }
  }
}

/**
 * Process ungrouped data mutations
 */
export function processUngroupedMutations<Row extends Record<string, unknown>>(
  df: DataFrame<Row> | GroupedDataFrame<Row>,
  spec: MutateAssignments<Row>,
  updates: Record<string, unknown[]>,
): void {
  const profile = (globalThis as any).__TIDY_PROFILE;
  let t0 = profile ? performance.now() : 0;
  const api = df as any;
  const store = api.__store;
  const row = api.__rowView as any;
  if (profile) console.log(`    [ungroupedMutate] access store/rowView: ${(performance.now() - t0).toFixed(4)}ms`);

  // Defer nrows() — only needed for Array.isArray(expr) validation.
  // Calling it eagerly triggers materializeIndex on rawMask views (~0.35ms).
  let _n: number | undefined;
  const getNrows = () => {
    if (_n === undefined) {
      t0 = profile ? performance.now() : 0;
      _n = (df as DataFrame<Row>).nrows();
      if (profile) console.log(`    [ungroupedMutate] nrows() [deferred]: ${(performance.now() - t0).toFixed(4)}ms, n=${_n}`);
    }
    return _n;
  };

  // For ungrouped data, need to respect the view (filtered/masked data)
  const view = api.__view;
  const storeLength = store.length;
  t0 = profile ? performance.now() : 0;

  // Fast path: no view means physical === logical, skip materializeIndex entirely
  const isIdentity = !view?.mask && !view?.rawMask && !view?.index;
  // rawMask-only: napi can process full store columns (no gather/scatter needed),
  // but non-napi paths still need the materialized index for correct row mapping.
  const isRawMaskOnly = !isIdentity && !!view?.rawMask && !view?.mask && !view?.index;
  const materializedIndex = isIdentity ? null : (isRawMaskOnly ? null : materializeIndex(storeLength, view));
  const len = isIdentity ? storeLength : (isRawMaskOnly ? storeLength : materializedIndex!.length);
  if (profile) console.log(`    [ungroupedMutate] materializeIndex(${storeLength}): ${(performance.now() - t0).toFixed(4)}ms, identity=${isIdentity}, rawMaskOnly=${isRawMaskOnly}, viewKeys=${view ? Object.keys(view).filter(k => (view as any)[k] != null).join(",") : "none"}`);

  for (const [col, expr] of Object.entries(spec)) {
    if (expr === null) {
      continue;
    }
    t0 = profile ? performance.now() : 0;
    if (typeof expr === "function") {
      // Try columnar fast path: detect simple column-access patterns
      // (napi path may set updates[col] directly — no pre-allocation needed)
      const rawMask = isRawMaskOnly ? view.rawMask as Uint8Array : null;
      if (profile) console.log(`    [ungroupedMutate] trying columnar for "${col}", materializedIndex=${materializedIndex ? `Uint32(${materializedIndex.length})` : "null"}, len=${len}, rawMask=${rawMask ? `Uint8(${rawMask.length})` : "null"}`);
      const columnarFn = tryColumnarMutate(expr, store, col, updates, len, materializedIndex, rawMask, profile);
      if (!columnarFn) {
        // Napi/columnar didn't handle it — need materialized index for rawMask views
        const idx = materializedIndex ?? (isRawMaskOnly ? materializeIndex(storeLength, view) : null);
        const rowLen = idx ? idx.length : len;
        if (!updates[col]) updates[col] = new Array(storeLength);
        // Fallback: row-by-row via RowView cursor
        let _setCursorTotal = 0;
        let _fnCallTotal = 0;
        if (!idx) {
          for (let i = 0; i < rowLen; i++) {
            if (profile) { const _ts = performance.now(); row.setCursor(i); _setCursorTotal += performance.now() - _ts; }
            else row.setCursor(i);
            if (profile) { const _tf = performance.now(); updates[col][i] = (expr as any)(row, i, df); _fnCallTotal += performance.now() - _tf; }
            else updates[col][i] = (expr as any)(row, i, df);
          }
        } else {
          for (let i = 0; i < rowLen; i++) {
            const physicalIndex = idx[i];
            if (profile) { const _ts = performance.now(); row.setCursor(physicalIndex); _setCursorTotal += performance.now() - _ts; }
            else row.setCursor(physicalIndex);
            if (profile) { const _tf = performance.now(); updates[col][physicalIndex] = (expr as any)(row, i, df); _fnCallTotal += performance.now() - _tf; }
            else updates[col][physicalIndex] = (expr as any)(row, i, df);
          }
        }
        if (profile) {
          console.log(`    [ungroupedMutate] fn col "${col}"(${rowLen} rows, rowView): ${(performance.now() - t0).toFixed(4)}ms`);
          console.log(`      [ungroupedMutate] setCursor total: ${_setCursorTotal.toFixed(4)}ms`);
          console.log(`      [ungroupedMutate] fn call total: ${_fnCallTotal.toFixed(4)}ms`);
        }
      }
    } else if (Array.isArray(expr)) {
      const n = getNrows();
      if (expr.length !== n) {
        throw new Error(
          `Array length mismatch for column "${col}": provided ${expr.length} values but DataFrame has ${n} rows. ` +
            `Array values must match the number of rows in the DataFrame.`,
        );
      }
      if (isIdentity) {
        // Zero-copy: assign the array directly
        updates[col] = expr as unknown[];
      } else {
        const idx = materializedIndex ?? materializeIndex(storeLength, view);
        if (!updates[col]) updates[col] = new Array(storeLength);
        for (let i = 0; i < idx.length; i++) {
          updates[col][idx[i]] = expr[i];
        }
      }
      if (profile) console.log(`    [ungroupedMutate] array col "${col}"(${getNrows()} rows): ${(performance.now() - t0).toFixed(4)}ms`);
    } else {
      // For numeric scalars on identity/rawMask, use napi fill (returns Float64Array — fastest eager fill).
      // Note: Polars pl.lit() is lazy (0.013ms) so the ratio looks bad, but our eager fill at 0.08ms
      // is the fastest materialized option (vs new Array().fill at 0.39ms).
      if ((isIdentity || isRawMaskOnly) && typeof expr === "number") {
        const filled = mutate_fill_scalar(storeLength, expr);
        if (filled) {
          updates[col] = filled as unknown as unknown[];
          if (profile) console.log(`    [ungroupedMutate] napi fill-scalar "${col}"(${storeLength} rows): ${(performance.now() - t0).toFixed(4)}ms`);
          continue;
        }
      }
      if (!updates[col]) updates[col] = new Array(storeLength);
      if (isIdentity || isRawMaskOnly) {
        updates[col].fill(expr as any);
      } else {
        const idx = materializedIndex ?? materializeIndex(storeLength, view);
        for (let i = 0; i < idx.length; i++) {
          updates[col][idx[i]] = expr;
        }
      }
      if (profile) console.log(`    [ungroupedMutate] scalar col "${col}"(${len} rows): ${(performance.now() - t0).toFixed(4)}ms`);
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Columnar fast path for mutate functions                                     */
/* -------------------------------------------------------------------------- */

// deno-lint-ignore no-explicit-any
type ColumnsMap = Record<string, any[]>;

const OP_MAP: Record<string, number> = { "+": 0, "-": 1, "*": 2, "/": 3 };
const CMP_MAP: Record<string, number> = { ">": 0, ">=": 1, "<": 2, "<=": 3, "===": 4, "!==": 5, "==": 4, "!=": 5 };

/** Cached parse result for a mutate function */
interface ParsedMutatePattern {
  param: string;
  body: string;
  isComplex: boolean; // has function calls, ternary, if
}

// Cache parsed function strings to avoid re-parsing String(fn) + regex on every call
const _parsedFnCache = new WeakMap<Function, ParsedMutatePattern>();

function parseMutateFunction(expr: Function): ParsedMutatePattern | null {
  const cached = _parsedFnCache.get(expr);
  if (cached) return cached;

  const s = String(expr);
  const paramMatch = /^\(?(\w+)\)?\s*=>/.exec(s);
  if (!paramMatch) return null;

  const bodyMatch = /=>\s*(.+)$/.exec(s);
  if (!bodyMatch) return null;

  const body = bodyMatch[1].trim();
  const isComplex = /\(/.test(body) || /\?/.test(body) || /\bif\b/.test(body);

  const result: ParsedMutatePattern = { param: paramMatch[1], body, isComplex };
  _parsedFnCache.set(expr, result);
  return result;
}

/**
 * Try napi vectorized path for simple binary numeric patterns.
 * Only works on identity view (no index/mask) and Float64Array columns.
 * Returns true if handled.
 */
/** Gather a Float64Array through an index into a compact Float64Array. */
function gatherF64(src: Float64Array, idx: Uint32Array): Float64Array {
  const out = new Float64Array(idx.length);
  for (let i = 0; i < idx.length; i++) out[i] = src[idx[i]];
  return out;
}

/** Scatter a compact result array back to full-store-size updates array. */
function scatterResult(
  compact: Float64Array | Uint8Array,
  idx: Uint32Array,
  storeLength: number,
  updates: Record<string, unknown[]>,
  col: string,
): void {
  if (!updates[col]) updates[col] = new Array(storeLength);
  for (let i = 0; i < idx.length; i++) {
    updates[col][idx[i]] = compact[i];
  }
}

function tryNapiMutate(
  { body, param: p }: ParsedMutatePattern,
  // deno-lint-ignore no-explicit-any
  store: any,
  col: string,
  updates: Record<string, unknown[]>,
  len: number,
  materializedIndex: Uint32Array | null,
  rawMask: Uint8Array | null,
  profile: boolean,
): boolean {
  const idx = materializedIndex;
  const storeLength = store.length as number;
  let _tn = profile ? performance.now() : 0;

  // Pattern: r.colA op r.colB
  const binColMatch = new RegExp(
    `^${p}\\.(\\w+)\\s*([+\\-*/])\\s*${p}\\.(\\w+)$`,
  ).exec(body);
  if (profile) console.log(`        [tryNapi] regex binCol: ${(performance.now() - _tn).toFixed(4)}ms, match=${!!binColMatch}`);
  if (binColMatch) {
    const [, colA, op, colB] = binColMatch;
    const opCode = OP_MAP[op];
    if (opCode === undefined) return false;
    const a = store.columns[colA];
    const b = store.columns[colB];
    if (!(a instanceof Float64Array) || !(b instanceof Float64Array)) return false;
    try {
      let tb = profile ? performance.now() : 0;
      const ga = idx ? gatherF64(a, idx) : a;
      const gb = idx ? gatherF64(b, idx) : b;
      if (profile && idx) console.log(`      [mutate] gather(${idx.length}): ${(performance.now() - tb).toFixed(4)}ms`);
      tb = profile ? performance.now() : 0;
      const result = mutate_binary_cols(ga, gb, opCode);
      if (profile) console.log(`      [mutate] napi call(${ga.length}): ${(performance.now() - tb).toFixed(4)}ms`);
      if (result) {
        tb = profile ? performance.now() : 0;
        if (idx) {
          scatterResult(result, idx, storeLength, updates, col);
          if (profile) console.log(`      [mutate] scatter(${idx.length}): ${(performance.now() - tb).toFixed(4)}ms`);
        } else {
          updates[col] = result as unknown as unknown[];
          if (profile) console.log(`      [mutate] assign: ${(performance.now() - tb).toFixed(4)}ms`);
        }
        if (profile) console.log(`    [mutate] napi binary "${colA} ${op} ${colB}"(${ga.length} rows${idx ? ", view" : ""}): ok`);
        return true;
      }
    } catch { /* napi not available */ }
    return false;
  }

  // Pattern: r.colA op number  OR  number op r.colA
  _tn = profile ? performance.now() : 0;
  const colScalarMatch = new RegExp(
    `^${p}\\.(\\w+)\\s*([+\\-*/])\\s*(-?\\d+(?:\\.\\d+)?)$`,
  ).exec(body);
  if (profile) console.log(`        [tryNapi] regex colScalar: ${(performance.now() - _tn).toFixed(4)}ms, match=${!!colScalarMatch}`);
  if (colScalarMatch) {
    const [, colA, op, numStr] = colScalarMatch;
    const opCode = OP_MAP[op];
    if (opCode === undefined) return false;
    const a = store.columns[colA];
    if (!(a instanceof Float64Array)) return false;
    try {
      const ga = idx ? gatherF64(a, idx) : a;
      const result = mutate_col_scalar(ga, Number(numStr), opCode);
      if (result) {
        if (idx) {
          scatterResult(result, idx, storeLength, updates, col);
        } else {
          updates[col] = result as unknown as unknown[];
        }
        if (profile) console.log(`    [mutate] napi col-scalar "${colA} ${op} ${numStr}"(${ga.length} rows${idx ? ", view" : ""}): ok`);
        return true;
      }
    } catch { /* napi not available */ }
    return false;
  }

  // Pattern: number op r.colA (e.g. 2 * r.x)
  _tn = profile ? performance.now() : 0;
  const scalarColMatch = new RegExp(
    `^(-?\\d+(?:\\.\\d+)?)\\s*([+\\-*/])\\s*${p}\\.(\\w+)$`,
  ).exec(body);
  if (profile) console.log(`        [tryNapi] regex scalarCol: ${(performance.now() - _tn).toFixed(4)}ms, match=${!!scalarColMatch}`);
  if (scalarColMatch) {
    const [, numStr, op, colA] = scalarColMatch;
    const a = store.columns[colA];
    if (!(a instanceof Float64Array)) return false;
    if (op === "+" || op === "*") {
      const opCode = OP_MAP[op];
      try {
        const ga = idx ? gatherF64(a, idx) : a;
        const result = mutate_col_scalar(ga, Number(numStr), opCode);
        if (result) {
          if (idx) {
            scatterResult(result, idx, storeLength, updates, col);
          } else {
            updates[col] = result as unknown as unknown[];
          }
          if (profile) console.log(`    [mutate] napi scalar-col "${numStr} ${op} ${colA}"(${ga.length} rows${idx ? ", view" : ""}): ok`);
          return true;
        }
      } catch { /* napi not available */ }
    }
    return false;
  }

  // Pattern: r.colA cmp number (e.g. r.x > 50)
  _tn = profile ? performance.now() : 0;
  const cmpScalarMatch = new RegExp(
    `^${p}\\.(\\w+)\\s*(>=|<=|===|!==|==|!=|>|<)\\s*(-?\\d+(?:\\.\\d+)?)$`,
  ).exec(body);
  if (profile) console.log(`        [tryNapi] regex cmpScalar: ${(performance.now() - _tn).toFixed(4)}ms, match=${!!cmpScalarMatch}`);
  if (cmpScalarMatch) {
    const [, colA, op, numStr] = cmpScalarMatch;
    const opCode = CMP_MAP[op];
    if (opCode === undefined) return false;
    const a = store.columns[colA];
    if (!(a instanceof Float64Array)) return false;
    try {
      const ga = idx ? gatherF64(a, idx) : a;
      const result = mutate_compare_scalar_raw(ga, Number(numStr), opCode);
      if (result) {
        if (idx) {
          // Scatter Uint8Array boolean mask back, converting 0/1 → false/true
          if (!updates[col]) updates[col] = new Array(storeLength);
          for (let i = 0; i < idx.length; i++) updates[col][idx[i]] = result[i] !== 0;
        } else {
          // Store raw Uint8Array (0/1) — proxy/RowView convert to boolean on read
          updates[col] = result as unknown as unknown[];
        }
        if (profile) console.log(`    [mutate] napi cmp-scalar "${colA} ${op} ${numStr}"(${ga.length} rows${idx ? ", view" : ""}): ok`);
        return true;
      }
    } catch { /* napi not available */ }
    return false;
  }

  // Pattern: r.colA cmp r.colB (e.g. r.x > r.y)
  _tn = profile ? performance.now() : 0;
  const cmpColMatch = new RegExp(
    `^${p}\\.(\\w+)\\s*(>=|<=|===|!==|==|!=|>|<)\\s*${p}\\.(\\w+)$`,
  ).exec(body);
  if (profile) console.log(`        [tryNapi] regex cmpCol: ${(performance.now() - _tn).toFixed(4)}ms, match=${!!cmpColMatch}`);
  if (cmpColMatch) {
    const [, colA, op, colB] = cmpColMatch;
    const opCode = CMP_MAP[op];
    if (opCode === undefined) return false;
    const a = store.columns[colA];
    const b = store.columns[colB];
    if (!(a instanceof Float64Array) || !(b instanceof Float64Array)) return false;
    try {
      const ga = idx ? gatherF64(a, idx) : a;
      const gb = idx ? gatherF64(b, idx) : b;
      const result = mutate_compare_cols_raw(ga, gb, opCode);
      if (result) {
        if (idx) {
          // Convert 0/1 → false/true when scattering into plain Array
          if (!updates[col]) updates[col] = new Array(storeLength);
          for (let i = 0; i < idx.length; i++) updates[col][idx[i]] = result[i] !== 0;
        } else {
          updates[col] = result as unknown as unknown[];
        }
        if (profile) console.log(`    [mutate] napi cmp-cols "${colA} ${op} ${colB}"(${ga.length} rows${idx ? ", view" : ""}): ok`);
        return true;
      }
    } catch { /* napi not available */ }
    return false;
  }

  return false;
}

/**
 * Try napi-accelerated ternary: r.col CMP scalar ? valA : valB
 * Uses mutate_compare_scalar to get mask, then vectorized assign.
 */
function tryNapiTernary(
  { body, param: p }: ParsedMutatePattern,
  // deno-lint-ignore no-explicit-any
  store: any,
  col: string,
  updates: Record<string, unknown[]>,
  len: number,
  profile: boolean,
): boolean {
  // Pattern: r.col CMP number ? 'strA' : 'strB'  OR  r.col CMP number ? numA : numB
  const ternaryMatch = new RegExp(
    `^${p}\\.(\\w+)\\s*(>=|<=|===|!==|==|!=|>|<)\\s*(-?\\d+(?:\\.\\d+)?)\\s*\\?\\s*(.+?)\\s*:\\s*(.+)$`,
  ).exec(body);
  if (!ternaryMatch) return false;

  const [, colA, op, numStr, thenRaw, elseRaw] = ternaryMatch;
  const opCode = CMP_MAP[op];
  if (opCode === undefined) return false;
  const a = store.columns[colA];
  if (!(a instanceof Float64Array)) return false;

  // Parse the then/else values (string literals or numbers)
  const thenVal = parseLiteral(thenRaw.trim());
  const elseVal = parseLiteral(elseRaw.trim());
  if (thenVal === undefined || elseVal === undefined) return false;

  try {
    const t0 = profile ? performance.now() : 0;
    const raw = mutate_compare_scalar_raw(a, Number(numStr), opCode);
    if (!raw) return false;

    const out = new Array(len);
    for (let i = 0; i < len; i++) {
      out[i] = raw[i] ? thenVal : elseVal;
    }
    updates[col] = out;
    if (profile) console.log(`    [mutate] napi ternary "${colA} ${op} ${numStr} ? ${thenRaw.trim()} : ${elseRaw.trim()}"(${len} rows): ${(performance.now() - t0).toFixed(4)}ms`);
    return true;
  } catch {
    return false;
  }
}

/** Parse a string/number literal from source code */
function parseLiteral(s: string): unknown {
  // String literal: 'foo' or "foo"
  if ((s.startsWith("'") && s.endsWith("'")) || (s.startsWith('"') && s.endsWith('"'))) {
    return s.slice(1, -1);
  }
  // Number literal
  if (/^-?\d+(\.\d+)?$/.test(s)) {
    return Number(s);
  }
  // Boolean
  if (s === "true") return true;
  if (s === "false") return false;
  if (s === "null") return null;
  return undefined;
}


/**
 * Try to detect a simple mutate expression and execute it column-wise.
 * Returns true if handled, false if fallback needed.
 *
 * Detects patterns like:
 *   r => r.x + r.y
 *   r => r.x * 2
 *   r => r.x > 50
 *   r => r.x + 1
 */
function tryColumnarMutate(
  // deno-lint-ignore no-explicit-any
  expr: any,
  // deno-lint-ignore no-explicit-any
  store: any,
  col: string,
  updates: Record<string, unknown[]>,
  len: number,
  materializedIndex: Uint32Array | null,
  rawMask: Uint8Array | null,
  profile: boolean,
): boolean {
  let _tc = profile ? performance.now() : 0;
  const parsed = parseMutateFunction(expr);
  if (profile) console.log(`      [tryColumnar] parseMutateFunction: ${(performance.now() - _tc).toFixed(4)}ms, result=${parsed ? `"${parsed.body}"` : "null"}`);
  if (!parsed) return false;
  const { param: p, body, isComplex } = parsed;

  // Try napi vectorized path first (only for simple numeric binary ops on identity view)
  if (!isComplex) {
    _tc = profile ? performance.now() : 0;
    const napiResult = tryNapiMutate(parsed, store, col, updates, len, materializedIndex, rawMask, profile);
    if (profile) console.log(`      [tryColumnar] tryNapiMutate: ${(performance.now() - _tc).toFixed(4)}ms, result=${napiResult}`);
    if (napiResult) {
      return true;
    }
  }

  // Try ternary pattern: r.col CMP val ? litA : litB
  if (!materializedIndex && /\?/.test(body) && !/\(/.test(body)) {
    const ternaryResult = tryNapiTernary(parsed, store, col, updates, len, profile);
    if (ternaryResult) return true;
  }

  // For complex expressions (function calls like .toUpperCase(), Math.round(), .slice(), etc.),
  // skip napi (string marshalling overhead > JS execution) and fall through to the
  // generic JS columnar path (new Function) which accesses columns directly.

  // Parse column references: r.colName
  const colRefs = new Set<string>();
  const colPattern = new RegExp(`${p}\\.(\\w+)`, "g");
  let m;
  while ((m = colPattern.exec(body)) !== null) {
    colRefs.add(m[1]);
  }

  if (colRefs.size === 0) return false;

  // Verify all referenced columns exist
  for (const ref of colRefs) {
    if (!store.columns[ref]) return false;
  }

  // Build a direct column-access function
  // Replace r.colName with cols["colName"][i]
  let transformed = body;
  for (const ref of colRefs) {
    transformed = transformed.replace(
      new RegExp(`${p}\\.${ref}`, "g"),
      `cols["${ref}"][i]`,
    );
  }

  // Create and execute the columnar function
  try {
    const fn = new Function("cols", "out", "len", "idx", `
      if (idx) {
        for (let i = 0; i < len; i++) {
          const pi = idx[i];
          out[pi] = ${transformed.replace(/\bcols\["(\w+)"\]\[i\]/g, 'cols["$1"][pi]')};
        }
      } else {
        for (let i = 0; i < len; i++) {
          out[i] = ${transformed};
        }
      }
    `) as (cols: ColumnsMap, out: unknown[], len: number, idx: Uint32Array | null) => void;

    if (!updates[col]) updates[col] = new Array(store.length);
    const t0 = profile ? performance.now() : 0;
    fn(store.columns, updates[col], len, materializedIndex);
    if (profile) console.log(`    [ungroupedMutate] fn col "${col}"(${len} rows, columnar "${transformed}"): ${(performance.now() - t0).toFixed(4)}ms`);
    return true;
  } catch {
    return false;
  }
}
