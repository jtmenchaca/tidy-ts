// deno-lint-ignore-file no-explicit-any
import {
  bitsetClear,
  bitsetFromMask,
  bitsetGet,
  bitsetSet,
  createBitSet,
} from "../../dataframe/implementation/columnar-view.ts";
import { withMask, withRawMask } from "../../dataframe/implementation/row-cursor.ts";
import { materializeIndex, rebuildGroupsColumnar } from "../../dataframe/index.ts";
import {
  // numeric/date WASM only; string WASM stays disabled (too much overhead)
  batch_filter_bitset,
  batch_filter_numbers,
} from "../../wasm/wasm-loader.ts";
import {
  mutate_compare_scalar_raw,
  mutate_compare_cols_raw,
} from "../../wasm/sorting-functions.ts";
import {
  returnsPromise,
} from "../../promised-dataframe/index.ts";
import {
  type ConcurrencyOptions,
  DEFAULT_CONCURRENCY,
  processConcurrently,
} from "../../promised-dataframe/concurrency-utils.ts";
import { tracer } from "../../telemetry/tracer.ts";

// Helper function for filter verb that handles logical indexing
function makeRowSnapshot(
  api: any,
  logicalIndex: number,
): object {
  const store = api.__store;
  const phys = getPhysicalIndex(api, logicalIndex);
  const snap: object = {};
  for (const name of store.columnNames) {
    (snap as any)[name] = store.columns[name][phys];
  }
  return snap;
}

function makePhysicalSnapshot(
  store: any,
  physicalIndex: number,
): object {
  const snap: any = {};
  for (const name of store.columnNames) {
    snap[name] = store.columns[name][physicalIndex];
  }
  return snap;
}

type OptimizedPredicate = (
  rowIndex: number,
  columns: Record<string, unknown[]>,
) => boolean;

/* -------------------------------------------------------------------------- */
/* Tunables                                                                   */
/* -------------------------------------------------------------------------- */
const ENABLE_WASM_NUMERIC = true;
const WASM_MIN_ROWS_NUMERIC = 0; // napi has negligible overhead; WASM threshold handled internally

/* -------------------------------------------------------------------------- */
/* Public API                                                                  */
/* -------------------------------------------------------------------------- */

// Implementation — user-facing types are in filter.types.ts
export function filter(
  ...args: any[]
): any {
  return (df: any): any => {
    // Sync only. Use filterAsync for async predicates.
    const predicates: any[] = args;
    return filterRowsSync(df, predicates);
  };
}

// Async filter — always routes to async implementation
export function filterAsync(
  ...args: any[]
): any {
  return (df: any): any => {
    let predicates: any[];
    let options: ConcurrencyOptions | undefined;

    // Check if last argument is a ConcurrencyOptions object
    const lastArg = args[args.length - 1];
    const isLastArgOptions = lastArg &&
      typeof lastArg === "object" &&
      !Array.isArray(lastArg) &&
      !("length" in lastArg) &&
      (lastArg.concurrency !== undefined || lastArg.batchSize !== undefined ||
        lastArg.retry !== undefined);

    if (isLastArgOptions) {
      predicates = args.slice(0, -1);
      options = lastArg as ConcurrencyOptions;
    } else {
      predicates = args;
      options = undefined;
    }

    const dfOptions = (df as any).__options as ConcurrencyOptions | undefined;
    const concurrencyOptions = options || dfOptions || DEFAULT_CONCURRENCY.filter;
    return filterRowsAsync(df, predicates, concurrencyOptions);
  };
}

// Sync implementation (original logic)
function filterRowsSync(
  df: any,
  predicates: any[],
): any {
  const _pf = (globalThis as any).__TIDY_PROFILE;
  const _tSpan = _pf ? performance.now() : 0;
  const span = tracer.startSpan(df, "filter", {
    predicates: predicates.length,
  });
  if (_pf) console.log(`  [filter] tracer.startSpan: ${(performance.now() - _tSpan).toFixed(4)}ms`);

  try {
    const profile = (globalThis as any).__TIDY_PROFILE;
    const t0 = profile ? performance.now() : 0;

    const api = df as any;
    const store = api.__store;
    const nRowsFull = store.length;

    if (profile) {
      const _ts = performance.now();
      const _span = tracer.startSpan;
      console.log(`  [filter] setup (store access, span): ${(performance.now() - t0).toFixed(4)}ms`);
    }

    // Ultra-fast raw mask path: use mutate_compare_scalar_raw to produce
    // Uint8Array directly (skips bitset packing entirely).
    // Only for plain frames with simple numeric predicates that can all be
    // handled by napi compare kernels.
    let _tPlain = profile ? performance.now() : 0;
    const _isPlain = isPlainFrame(api);
    if (profile) console.log(`  [filter] isPlainFrame: ${(performance.now() - _tPlain).toFixed(4)}ms, result=${_isPlain}`);
    if (_isPlain) {
      try {
        const t1 = profile ? performance.now() : 0;
        const rawResult = tryRawMaskFilterPath(store, predicates, nRowsFull, profile);
        if (rawResult) {
          if (profile) console.log(`  [filter] tryRawMaskFilterPath: ${(performance.now() - t1).toFixed(4)}ms`);
          const t3 = profile ? performance.now() : 0;
          const out = withRawMask(df, rawResult);
          if (profile) console.log(`  [filter] withRawMask: ${(performance.now() - t3).toFixed(4)}ms`);
          let _tCopy = profile ? performance.now() : 0;
          rebuildFilteredGroups(df, out);
          tracer.copyContext(df, out);
          if (profile) console.log(`  [filter] tracer.copyContext + groups: ${(performance.now() - _tCopy).toFixed(4)}ms`);
          if (profile) console.log(`  [filter] TOTAL (rawMask path): ${(performance.now() - t0).toFixed(4)}ms`);
          return out;
        }
      } catch {
        /* fall through */
      }
    }

    // Numeric/date WASM fast-path for very large unmasked, unindexed frames
    if (
      ENABLE_WASM_NUMERIC && nRowsFull >= WASM_MIN_ROWS_NUMERIC &&
      isPlainFrame(api)
    ) {
      try {
        const t1 = profile ? performance.now() : 0;
        const wasmResult = tryWasmFilterPath(df, predicates, nRowsFull);
        if (profile) console.log(`  [filter] tryWasmFilterPath: ${(performance.now() - t1).toFixed(4)}ms, result=${wasmResult ? 'hit' : 'miss'}`);
        if (wasmResult) {
          const t3 = profile ? performance.now() : 0;
          const out = withMask(df, wasmResult);
          if (profile) console.log(`  [filter] withMask: ${(performance.now() - t3).toFixed(4)}ms`);
          if (profile) console.log(`  [filter] TOTAL (WASM path): ${(performance.now() - t0).toFixed(4)}ms`);
          rebuildFilteredGroups(df, out);
          tracer.copyContext(df, out);
          return out;
        }
      } catch {
        /* fall through to JS path */
      }
    }

    // JS path: build AND mask directly in a BitSet
    const t4 = profile ? performance.now() : 0;
    const bs = tracer.withSpan(df, "compute-filter-mask", () => {
      const bitset = createBitSet(nRowsFull);
      computeFilterMaskDirectly_AND(df, predicates, bitset);
      return bitset;
    });
    if (profile) console.log(`  [filter] computeFilterMaskDirectly_AND(${nRowsFull}): ${(performance.now() - t4).toFixed(4)}ms`);

    // If there's an existing view/mask, combine with the new filter using AND
    const finalMask = tracer.withSpan(df, "combine-masks", () => {
      const existingView = (df as any).__view;
      if (existingView?.mask) {
        // Create a new BitSet that combines existing mask AND new filter
        const combinedMask = createBitSet(nRowsFull);
        // Only set bits that are true in BOTH existing mask AND new filter
        for (let i = 0; i < nRowsFull; i++) {
          if (bitsetGet(existingView.mask, i) && bitsetGet(bs, i)) {
            bitsetSet(combinedMask, i);
          }
        }
        return combinedMask;
      }
      if (existingView?.rawMask) {
        // Combine rawMask (Uint8Array) AND new bitset filter
        const combinedMask = createBitSet(nRowsFull);
        for (let i = 0; i < nRowsFull; i++) {
          if (existingView.rawMask[i] && bitsetGet(bs, i)) {
            bitsetSet(combinedMask, i);
          }
        }
        return combinedMask;
      }
      return bs;
    });

    const t5 = profile ? performance.now() : 0;
    const out = tracer.withSpan(df, "create-filtered-dataframe", () => {
      return withMask(df, finalMask);
    });
    if (profile) console.log(`  [filter] withMask: ${(performance.now() - t5).toFixed(4)}ms`);
    if (profile) console.log(`  [filter] TOTAL (JS path): ${(performance.now() - t0).toFixed(4)}ms`);

    // Copy trace context to new DataFrame
    tracer.copyContext(df, out);

    rebuildFilteredGroups(df, out);
    return out;
  } finally {
    tracer.endSpan(df, span);
  }
}

/* -------------------------------------------------------------------------- */
/* Raw Uint8Array mask path — fastest for simple numeric predicates            */
/* -------------------------------------------------------------------------- */

const CMP_MAP_FILTER: Record<string, number> = { ">": 0, ">=": 1, "<": 2, "<=": 3, "===": 4, "!==": 5, "==": 4, "!=": 5 };

/**
 * Try to produce a raw Uint8Array mask using napi compare kernels.
 * Handles single and AND-compound numeric predicates on Float64Array columns.
 * Returns null if any predicate can't be handled.
 */
function tryRawMaskFilterPath(
  store: any,
  predicates: any[],
  n: number,
  profile: boolean,
): Uint8Array | null {
  if (predicates.length === 0) return null;

  let mask: Uint8Array | null = null;

  for (const pred of predicates) {
    if (Array.isArray(pred)) return null;

    const s = String(pred);
    const paramMatch = /\(?(\w+)\)?\s*=>/.exec(s);
    if (!paramMatch) return null;
    const p = paramMatch[1];

    const bodyMatch = /=>\s*(.+)$/.exec(s);
    if (!bodyMatch) return null;
    const body = bodyMatch[1].trim();

    // Detect negation wrapper: !(expr)
    let negated = false;
    let innerBody = body;
    const negMatch = /^!\((.+)\)$/.exec(body);
    if (negMatch) {
      negated = true;
      innerBody = negMatch[1].trim();
      // Compound negation !(a && b) → OR via De Morgan's — can't handle in AND-only path
      if (innerBody.includes("&&") || innerBody.includes("||")) return null;
    } else if (body.startsWith("!")) {
      return null; // Other negation forms we can't parse
    }

    // Split on && for compound predicates (only for non-negated)
    const clauses = !negated && innerBody.includes("&&") && !innerBody.includes("||")
      ? innerBody.split("&&").map((c: string) => c.trim())
      : [innerBody];

    let predMask: Uint8Array | null = null;

    for (const clause of clauses) {
      // Pattern: r.col CMP number
      const cmpMatch = new RegExp(
        `^${p}\\.(\\w+)\\s*(>=|<=|===|!==|==|!=|>|<)\\s*(-?\\d+(?:\\.\\d+)?)$`,
      ).exec(clause);
      if (!cmpMatch) return null;

      let [, colName, op, numStr] = cmpMatch;
      // For negated simple predicates, flip the operator
      if (negated) {
        const flipped = flipOp(op);
        if (!flipped) return null;
        op = flipped;
      }
      const opCode = CMP_MAP_FILTER[op];
      if (opCode === undefined) return null;

      const col = store.columns[colName];
      if (!(col instanceof Float64Array)) return null;

      const t0 = profile ? performance.now() : 0;
      const result = mutate_compare_scalar_raw(col, Number(numStr), opCode);
      if (profile) console.log(`    [rawMaskFilter] compare "${colName} ${op} ${numStr}": ${(performance.now() - t0).toFixed(4)}ms`);
      if (!result) return null;

      if (!predMask) {
        predMask = result;
      } else {
        // AND in place
        for (let i = 0; i < n; i++) predMask[i] &= result[i];
      }
    }

    if (!predMask) return null;

    if (!mask) {
      mask = predMask;
    } else {
      // AND across predicates
      for (let i = 0; i < n; i++) mask[i] &= predMask[i];
    }
  }

  return mask;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function isPlainFrame(api: any): boolean {
  // Heuristic: only take numeric WASM fast path if there is no existing mask or index mapping.
  // (Direct column scans assume row index === storage index.)
  return !api?.__mask && !api?.__index && !api?.__slice && !api?.__view?.mask && !api?.__view?.rawMask && !api?.__view?.index;
}

function maskToBitset(mask: Uint8Array, _n: number): any {
  return bitsetFromMask(mask);
}

function andMasksInPlace(target: Uint8Array, src: Uint8Array): void {
  const n = target.length;
  for (let i = 0; i < n; i++) target[i] &= src[i];
}

/** Rebuild __groups on `out` after filtering a grouped DataFrame. */
function rebuildFilteredGroups(df: any, out: any): void {
  if (!df.__groups) return;
  const store = (out as any).__store;
  const idx = materializeIndex(store.length, (out as any).__view);
  const groupingColumns = df.__groups.groupingColumns.map(String);
  if (idx.length > 0 && groupingColumns.length > 0) {
    (out as any).__groups = rebuildGroupsColumnar(store, groupingColumns, idx);
    (out as any).__kind = "GroupedDataFrame";
  }
}

/* -------------------------------------------------------------------------- */
/* WASM (numeric-only) — returns BitSet directly when possible                  */
/* -------------------------------------------------------------------------- */

/** Try to produce a BitSet directly via the napi bitset export.
 *  Falls back to Uint8Array path + bitsetFromMask if bitset napi unavailable. */
function tryWasmFilterPath(
  df: any,
  predicates: any[],
  nRowsFull: number,
): any | null {
  if (predicates.length === 0) return null;
  const profile = (globalThis as any).__TIDY_PROFILE;

  const api = df as any;
  const store = api.__store;
  const n = store.length;

  // Detect all predicates first — bail early if any can't be handled
  const ops: { values: Float64Array; code: number; value: number }[] = [];
  for (const pred of predicates) {
    if (Array.isArray(pred)) return null; // fall to old path for array predicates

    const t1 = profile ? performance.now() : 0;
    // Try single predicate first, then compound (&&)
    const detectedOps = detectNumericOps(pred, store, n);
    if (profile) console.log(`    [wasmFilter] detectNumericOps: ${(performance.now() - t1).toFixed(4)}ms, result=${detectedOps ? detectedOps.length + ' ops' : 'null'}`);
    if (!detectedOps) return null;

    for (const detected of detectedOps) {
      ops.push(detected);
    }
  }

  // Try bitset path (returns Uint32Array directly, no conversion needed)
  const t3 = profile ? performance.now() : 0;
  const firstBits = batch_filter_bitset(ops[0].values, ops[0].value, ops[0].code);
  if (firstBits) {
    if (profile) console.log(`    [wasmFilter] batch_filter_bitset(${n}): ${(performance.now() - t3).toFixed(4)}ms`);
    const bs = { bits: firstBits, size: nRowsFull };

    // AND additional predicates
    for (let i = 1; i < ops.length; i++) {
      const t4 = profile ? performance.now() : 0;
      const moreBits = batch_filter_bitset(ops[i].values, ops[i].value, ops[i].code);
      if (!moreBits) {
        // fallback: shouldn't happen, but be safe
        return tryWasmFilterPathU8Fallback(df, predicates);
      }
      // AND in place (word-level)
      for (let w = 0; w < firstBits.length; w++) {
        firstBits[w] &= moreBits[w];
      }
      if (profile) console.log(`    [wasmFilter] batch_filter_bitset AND(${n}): ${(performance.now() - t4).toFixed(4)}ms`);
    }

    return bs;
  }

  // Fallback: use Uint8Array path
  if (profile) console.log(`    [wasmFilter] bitset path unavailable, falling back to u8`);
  return tryWasmFilterPathU8Fallback(df, predicates);
}

/** Legacy Uint8Array path — used when bitset napi export is not available */
function tryWasmFilterPathU8Fallback(
  df: any,
  predicates: any[],
): any | null {
  return tryWasmFilterPathNumericOnly(df, predicates);
}

function tryWasmFilterPathNumericOnly(
  df: any,
  predicates: any[],
): any | null {
  if (predicates.length === 0) return null;

  const api = df as any;
  const store = api.__store;
  const n = store.length;

  const mask = new Uint8Array(n).fill(1);
  let didWasm = false;

  for (const pred of predicates) {
    if (Array.isArray(pred)) {
      if (pred.length !== n) {
        throw new RangeError("Predicate array length differs from data length");
      }
      const arr = new Uint8Array(n);
      for (let i = 0; i < n; i++) arr[i] = pred[i] ? 1 : 0;
      andMasksInPlace(mask, arr);
      continue;
    }

    const op = detectSimplePredicate(pred);
    if (!op) return null;
    if (op.kind !== "number" && op.kind !== "date") return null;

    const col = store.columns[op.column];
    let values: Float64Array;
    if (col instanceof Float64Array && col.length === n) {
      values = col;
    } else {
      values = new Float64Array(n);
      for (let i = 0; i < n; i++) {
        const v = col[i];
        values[i] = v == null
          ? Number.NaN
          : typeof v === "number"
          ? v
          : v instanceof Date
          ? +v
          : Number.NaN;
      }
    }

    const code = opToCode(op.operator);
    if (code == null || Number.isNaN(op.value)) return null;

    const out = new Uint8Array(n);
    batch_filter_numbers(values, op.value, code, out);
    andMasksInPlace(mask, out);
    didWasm = true;
  }

  if (!didWasm) return null;
  return bitsetFromMask(mask);
}

type DetectedOp =
  | { kind: "number" | "date"; column: string; operator: string; value: number }
  | {
    kind: "string";
    column: string;
    operator: "===" | "!==" | "==" | "!=";
    value: string;
  }
  | { kind: "nullcheck"; column: string; operator: "== null" | "!= null" };

function detectSimplePredicate(
  pred: (...args: any[]) => any,
): DetectedOp | null {
  const s = String(pred);

  // Reject compound conditions (contains && or ||)
  if (s.includes("&&") || s.includes("||")) {
    return null;
  }

  // Extract parameter name: (row) =>, (r) =>, row =>, r =>
  const paramMatch = /\(?(\w+)\)?\s*=>/.exec(s);
  if (!paramMatch) return null;
  const p = paramMatch[1]; // the actual parameter name

  // Detect negation wrapper: !(expr) — unwrap and flip operator
  let negated = false;
  let innerSource = s;
  const bodyCheck = /=>\s*(.+)/.exec(s);
  if (bodyCheck) {
    const body = bodyCheck[1].trim();
    // Match !(single_expr) — unwrap the negation
    const negMatch = /^!\((.+)\)$/.exec(body);
    if (negMatch) {
      negated = true;
      // Rebuild source with the inner expression for the regex matchers below
      innerSource = s.replace(/=>\s*.+/, `=> ${negMatch[1].trim()}`);
    } else if (body.startsWith("!")) {
      // Other negation forms we can't parse (e.g. !r.flag)
      return null;
    }
  }

  // null checks
  {
    const m = new RegExp(`${p}\\.(\\w+)\\s*([!]?={1,2})\\s*null`).exec(innerSource);
    if (m) {
      const column = m[1];
      let op = m[2].startsWith("!") ? "!= null" : "== null";
      if (negated) op = op === "!= null" ? "== null" : "!= null";
      return {
        kind: "nullcheck",
        column,
        operator: op as "== null" | "!= null",
      };
    }
  }

  // string equality / inequality
  {
    const eq = new RegExp(`${p}\\.(\\w+)\\s*(===|==|!==|!=)\\s*(['"])(.*?)\\3`).exec(innerSource);
    if (eq) {
      const [, column, operator, , val] = eq;
      const finalOp = negated ? (flipOp(operator) ?? operator) : operator;
      return { kind: "string", column, operator: finalOp as any, value: val };
    }
  }

  // numeric / date compares against numeric literal
  {
    const cmp = new RegExp(`${p}\\.(\\w+)\\s*(>=|<=|>|<|===|==|!==|!=)\\s*([+\\d][\\d._eE+-]*)`).exec(innerSource);
    if (cmp) {
      const column = cmp[1], operator = cmp[2], raw = cmp[3];
      const value = Number(raw);
      if (!Number.isNaN(value)) {
        const finalOp = negated ? (flipOp(operator) ?? operator) : operator;
        return { kind: "number", column, operator: finalOp, value };
      }
    }
  }

  return null;
}

/** Detect numeric comparison ops from a predicate function.
 *  Handles both simple (r.x > 50) and compound AND (r.x > 50 && r.y < 25).
 *  Returns array of {values, code, value} for each comparison, or null if not all numeric. */
function detectNumericOps(
  pred: any,
  store: any,
  n: number,
): { values: Float64Array; code: number; value: number }[] | null {
  // Try simple predicate first
  const simple = detectSimplePredicate(pred);
  if (simple) {
    if (simple.kind !== "number" && simple.kind !== "date") return null;
    const resolved = resolveColumn(store, simple.column, n);
    if (!resolved) return null;
    const code = opToCode(simple.operator);
    if (code == null || Number.isNaN(simple.value)) return null;
    return [{ values: resolved, code, value: simple.value }];
  }

  // Try compound AND predicate
  const s = String(pred);
  if (!s.includes("&&") || s.includes("||")) return null;

  const paramMatch = /\(?(\w+)\)?\s*=>/.exec(s);
  if (!paramMatch) return null;
  const p = paramMatch[1];

  const bodyMatch = /=>\s*(.+)/.exec(s);
  if (!bodyMatch) return null;
  const bodyTrimmed = bodyMatch[1].trim();
  // Negated compound !(a && b) → OR via De Morgan's — can't handle in AND-only numeric path
  if (bodyTrimmed.startsWith("!")) return null;

  const clauses = bodyTrimmed.split("&&").map((c) => c.trim());
  const ops: { values: Float64Array; code: number; value: number }[] = [];

  for (const clause of clauses) {
    const m = new RegExp(
      `${p}\\.(\\w+)\\s*(>=|<=|>|<|===|==|!==|!=)\\s*([+\\d][\\d._eE+-]*)`,
    ).exec(clause);
    if (!m) return null;
    const column = m[1], operator = m[2], raw = m[3];
    const value = Number(raw);
    if (Number.isNaN(value)) return null;
    const code = opToCode(operator);
    if (code == null) return null;
    const resolved = resolveColumn(store, column, n);
    if (!resolved) return null;
    ops.push({ values: resolved, code, value });
  }

  return ops.length > 0 ? ops : null;
}

/** Get a column as Float64Array, zero-copy if possible */
function resolveColumn(store: any, column: string, n: number): Float64Array | null {
  const col = store.columns[column];
  if (!col) return null;
  if (col instanceof Float64Array && col.length === n) return col;
  const values = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const v = col[i];
    values[i] = v == null
      ? Number.NaN
      : typeof v === "number"
      ? v
      : v instanceof Date
      ? +v
      : Number.NaN;
  }
  return values;
}

function opToCode(op: string): number | null {
  switch (op) {
    case ">":
      return 0;
    case ">=":
      return 1;
    case "<":
      return 2;
    case "<=":
      return 3;
    case "==":
    case "===":
      return 4;
    case "!=":
    case "!==":
      return 5;
    default:
      return null;
  }
}

/** Flip a comparison operator for negation: !(a > b) → a <= b */
function flipOp(op: string): string | null {
  switch (op) {
    case ">": return "<=";
    case ">=": return "<";
    case "<": return ">=";
    case "<=": return ">";
    case "===": return "!==";
    case "==": return "!=";
    case "!==": return "===";
    case "!=": return "==";
    default: return null;
  }
}

/* -------------------------------------------------------------------------- */
/* JS path: direct BitSet with correct AND semantics                           */
/* -------------------------------------------------------------------------- */
function computeFilterMaskDirectly_AND(
  df: any,
  preds: any[],
  bs: any,
): void {
  const api: any = df as any;
  const store = api.__store;
  const nStore = store.length;
  const m = df.nrows(); // logical length

  if (preds.length === 0) {
    for (let p = 0; p < nStore; p++) bitsetSet(bs, p);
    return;
  }

  let first = true;

  for (const pred of preds) {
    // ----- Boolean-array predicate (length must match logical view) -----
    if (Array.isArray(pred)) {
      if (pred.length !== m) {
        throw new RangeError(
          "Predicate array length must equal current view length",
        );
      }
      if (first) {
        for (let i = 0; i < m; i++) {
          if (pred[i]) {
            const phys = getPhysicalIndex(api, i);
            if (phys >= 0) bitsetSet(bs, phys);
          }
        }
        first = false;
      } else {
        for (let i = 0; i < m; i++) {
          const phys = getPhysicalIndex(api, i);
          if (phys >= 0 && bitsetGet(bs, phys) && !pred[i]) {
            bitsetClear(bs, phys);
          }
        }
      }
      continue;
    }

    // Columnar fast paths work on any frame with a store (including masked frames).
    // The existing mask is ANDed in by combine-masks in filterRowsSync.
    const hasStore = !!store;

    const simple = hasStore ? detectSimplePredicate(pred as any) : null;

    // Null-check fast path: scan column directly for !== null / === null
    if (hasStore && simple?.kind === "nullcheck") {
      const col = store.columns[simple.column];
      if (col) {
        const isNotNull = simple.operator === "!= null";
        if (first) {
          for (let p = 0; p < nStore; p++) {
            const v = col[p];
            if (isNotNull ? v !== null && v !== undefined : v == null) {
              bitsetSet(bs, p);
            }
          }
          first = false;
        } else {
          for (let p = 0; p < nStore; p++) {
            if (bitsetGet(bs, p)) {
              const v = col[p];
              if (isNotNull ? v === null || v === undefined : v != null) {
                bitsetClear(bs, p);
              }
            }
          }
        }
        continue;
      }
    }

    if (hasStore && simple?.kind === "string") {
      const col = store.columns[simple.column] as unknown[];
      const val = simple.value;
      if (simple.operator === "===" || simple.operator === "==") {
        if (first) {
          for (let p = 0; p < nStore; p++) if (col[p] === val) bitsetSet(bs, p);
          first = false;
        } else {
          for (let p = 0; p < nStore; p++) {
            if (bitsetGet(bs, p) && col[p] !== val) bitsetClear(bs, p);
          }
        }
        continue;
      }
      if (simple.operator === "!==" || simple.operator === "!=") {
        if (first) {
          for (let p = 0; p < nStore; p++) if (col[p] !== val) bitsetSet(bs, p);
          first = false;
        } else {
          for (let p = 0; p < nStore; p++) {
            if (bitsetGet(bs, p) && col[p] === val) bitsetClear(bs, p);
          }
        }
        continue;
      }
    }
    // Try compound predicate optimization first
    const compoundOptimized = hasStore
      ? tryOptimizeCompoundPredicate(pred as any, Object.keys(store.columns))
      : null;
    if (compoundOptimized) {
      if (first) {
        for (let p = 0; p < nStore; p++) {
          if (compoundOptimized(p, store.columns)) bitsetSet(bs, p);
        }
        first = false;
      } else {
        for (let p = 0; p < nStore; p++) {
          if (bitsetGet(bs, p) && !compoundOptimized(p, store.columns)) {
            bitsetClear(bs, p);
          }
        }
      }
      continue;
    }

    const optimized = hasStore
      ? tryOptimizeNumericPredicate(pred as any, Object.keys(store.columns))
      : null;
    if (optimized) {
      if (first) {
        for (let p = 0; p < nStore; p++) {
          if (optimized(p, store.columns)) bitsetSet(bs, p);
        }
        first = false;
      } else {
        for (let p = 0; p < nStore; p++) {
          if (bitsetGet(bs, p) && !optimized(p, store.columns)) {
            bitsetClear(bs, p);
          }
        }
      }
      continue;
    }

    // ----- Fallback: evaluate on snapshots, AND by physical index -----
    // When we have a store, iterate physical indices directly to avoid
    // O(n²) logical→physical mapping via getPhysicalIndex.
    const existingView = api.__view;
    const existingMask = existingView?.mask;
    const existingRawMask = existingView?.rawMask;
    if (hasStore && !existingView?.index) {
      // No index mapping — iterate physical indices, check existing mask
      if (first) {
        for (let p = 0; p < nStore; p++) {
          if (existingMask && !bitsetGet(existingMask, p)) continue;
          if (existingRawMask && !existingRawMask[p]) continue;
          const snap = makePhysicalSnapshot(store, p);
          if ((pred as any)(snap, p, df)) bitsetSet(bs, p);
        }
        first = false;
      } else {
        for (let p = 0; p < nStore; p++) {
          if (!bitsetGet(bs, p)) continue;
          if (existingMask && !bitsetGet(existingMask, p)) {
            bitsetClear(bs, p);
            continue;
          }
          if (existingRawMask && !existingRawMask[p]) {
            bitsetClear(bs, p);
            continue;
          }
          const snap = makePhysicalSnapshot(store, p);
          if (!(pred as any)(snap, p, df)) bitsetClear(bs, p);
        }
      }
    } else if (first) {
      for (let i = 0; i < m; i++) {
        const phys = getPhysicalIndex(api, i);
        if (phys < 0) continue;
        const snap = makeRowSnapshot(api, i);

        if ((pred as any)(snap, i, df)) bitsetSet(bs, phys);
      }
      first = false;
    } else {
      for (let i = 0; i < m; i++) {
        const phys = getPhysicalIndex(api, i);
        if (phys < 0 || !bitsetGet(bs, phys)) continue;
        const snap = makeRowSnapshot(api, i);

        if (!(pred as any)(snap, i, df)) bitsetClear(bs, phys);
      }
    }
  }
}

function tryOptimizeCompoundPredicate(
  pred: (...args: any[]) => any,
  columnNames: string[],
): OptimizedPredicate | null {
  try {
    const s = String(pred);

    // Only handle simple AND compounds for now
    if (!s.includes("&&") || s.includes("||")) {
      return null;
    }

    // Extract parameter name
    const paramMatch = /\(?(\w+)\)?\s*=>/.exec(s);
    if (!paramMatch) return null;
    const p = paramMatch[1];

    // Extract the body after the arrow function
    const bodyMatch = /=>\s*(.+)/.exec(s);
    if (!bodyMatch) {
      return null;
    }

    const body = bodyMatch[1].trim();
    // Negated compound !(a && b) → OR via De Morgan's — can't handle in AND-only compound path
    if (body.startsWith("!")) return null;
    const andClauses = body.split("&&").map((clause) => clause.trim());
    const optimizedClauses: Array<
      (i: number, cols: Record<string, unknown[]>) => boolean
    > = [];

    for (const clause of andClauses) {
      // Try numeric comparison
      const numMatch = new RegExp(
        `${p}\\.(\\w+)\\s*(>=|<=|>|<|===|==|!==|!=)\\s*([+\\d][\\d._eE+-]*)`,
      ).exec(clause);
      if (numMatch && columnNames.includes(numMatch[1])) {
        const col = numMatch[1], op = numMatch[2], num = Number(numMatch[3]);
        if (!Number.isNaN(num)) {
          switch (op) {
            case ">":
              optimizedClauses.push((i, cols) =>
                (cols[col][i] as number) > num
              );
              break;
            case "<":
              optimizedClauses.push((i, cols) =>
                (cols[col][i] as number) < num
              );
              break;
            case ">=":
              optimizedClauses.push((i, cols) =>
                (cols[col][i] as number) >= num
              );
              break;
            case "<=":
              optimizedClauses.push((i, cols) =>
                (cols[col][i] as number) <= num
              );
              break;
            case "==":
            case "===":
              optimizedClauses.push((i, cols) => cols[col][i] === num);
              break;
            case "!=":
            case "!==":
              optimizedClauses.push((i, cols) => cols[col][i] !== num);
              break;
            default:
              return null;
          }
          continue;
        }
      }

      // Try string comparison
      const strMatch = new RegExp(
        `${p}\\.(\\w+)\\s*(===|==|!==|!=)\\s*['"]([^'"]*?)['"]`,
      ).exec(clause);
      if (strMatch && columnNames.includes(strMatch[1])) {
        const col = strMatch[1], op = strMatch[2], val = strMatch[3];
        switch (op) {
          case "===":
          case "==":
            optimizedClauses.push((i, cols) => cols[col][i] === val);
            break;
          case "!==":
          case "!=":
            optimizedClauses.push((i, cols) => cols[col][i] !== val);
            break;
          default:
            return null;
        }
        continue;
      }

      // Try boolean field access like r.active
      const boolMatch = new RegExp(`^${p}\\.(\\w+)$`).exec(clause);
      if (boolMatch && columnNames.includes(boolMatch[1])) {
        const col = boolMatch[1];
        optimizedClauses.push((i, cols) => !!cols[col][i]);
        continue;
      }

      // If we can't optimize this clause, return null
      return null;
    }

    // Return combined predicate that evaluates all clauses
    return (i, cols) => optimizedClauses.every((clause) => clause(i, cols));
  } catch {
    return null;
  }
}

function tryOptimizeNumericPredicate(
  pred: (...args: any[]) => any,
  columnNames: string[],
): OptimizedPredicate | null {
  try {
    const s = String(pred);

    if (s.includes("&&") || s.includes("||")) {
      return null;
    }

    // Extract parameter name dynamically
    const paramMatch = /\(?(\w+)\)?\s*=>/.exec(s);
    if (!paramMatch) return null;
    const p = paramMatch[1];

    const m = new RegExp(
      `${p}\\.(\\w+)\\s*(>=|<=|>|<|===|==|!==|!=)\\s*([+\\d][\\d._eE+-]*)`,
    ).exec(s);
    if (m && columnNames.includes(m[1])) {
      const col = m[1], op = m[2], num = Number(m[3]);
      if (!Number.isNaN(num)) {
        switch (op) {
          case ">":
            return (i, cols) => (cols[col][i] as number) > num;
          case "<":
            return (i, cols) => (cols[col][i] as number) < num;
          case ">=":
            return (i, cols) => (cols[col][i] as number) >= num;
          case "<=":
            return (i, cols) => (cols[col][i] as number) <= num;
          case "==":
          case "===":
            return (i, cols) => cols[col][i] === num;
          case "!=":
          case "!==":
            return (i, cols) => cols[col][i] !== num;
        }
      }
    }
  } catch {
    // ignore
  }
  return null;
}

// Helper to get physical index from logical index

function getPhysicalIndex(api: any, logicalIndex: number): number {
  const view = api.__view;
  if (!view) return logicalIndex;

  // If there's an explicit index mapping
  if (view.index && Array.isArray(view.index)) {
    return view.index[logicalIndex];
  }

  // If there's only a mask, we need to map logical to physical
  // This is a simplified mapping - real implementation might need more work
  if (view.mask) {
    let physicalIdx = -1;
    let logicalCount = -1;
    const nTotal = api.__store.length;
    for (let p = 0; p < nTotal; p++) {
      if (bitsetGet(view.mask, p)) {
        logicalCount++;
        if (logicalCount === logicalIndex) {
          physicalIdx = p;
          break;
        }
      }
    }
    return physicalIdx;
  }

  if (view.rawMask) {
    let physicalIdx = -1;
    let logicalCount = -1;
    const nTotal = api.__store.length;
    for (let p = 0; p < nTotal; p++) {
      if (view.rawMask[p]) {
        logicalCount++;
        if (logicalCount === logicalIndex) {
          physicalIdx = p;
          break;
        }
      }
    }
    return physicalIdx;
  }

  return logicalIndex;
}

// Async implementation with concurrency control
async function filterRowsAsync(
  df: any,
  predicates: any[],
  options: ConcurrencyOptions = DEFAULT_CONCURRENCY.filter,
): Promise<any> {
  const api = df as any;
  const store = api.__store;
  const n = df.nrows();

  // For async predicates, we can't use WASM optimizations
  // Fall back to row-by-row evaluation with concurrency control

  // Prepare row data and indices
  const rowData: {
    logicalIdx: number;
    physicalIdx: number;
    rowSnapshot: any;
  }[] = [];

  for (let i = 0; i < n; i++) {
    const rowSnapshot = makeRowSnapshot(api, i);
    const physicalIdx = getPhysicalIndex(api, i);
    rowData.push({ logicalIdx: i, physicalIdx, rowSnapshot });
  }

  // Create tasks for concurrent processing
  const tasks = rowData.map(
    ({ logicalIdx, physicalIdx, rowSnapshot }) => async () => {
      // Evaluate all predicates for this row
      const predicatePromises = predicates.map((pred) => {
        if (Array.isArray(pred)) {
          // Check array length against logical view size
          if (pred.length !== n) {
            throw new RangeError(
              "Predicate array length must equal current view length",
            );
          }
          return Promise.resolve(!!pred[logicalIdx]);
        } else if (typeof pred === "function") {
          try {
            const result = pred(rowSnapshot, logicalIdx, df);
            return returnsPromise(result)
              ? result.then((r) => !!r)
              : Promise.resolve(!!result);
          } catch (_error) {
            // If predicate throws, treat as false
            return Promise.resolve(false);
          }
        }
        return Promise.resolve(true);
      });

      // All predicates must be true (AND logic)
      const passed = await Promise.all(predicatePromises).then((results) =>
        results.every(Boolean)
      );

      return { physicalIdx, passed };
    },
  );

  // Process with concurrency control
  const evaluationResults = await processConcurrently(
    tasks,
    options,
  ) as { physicalIdx: number; passed: boolean }[];

  // Build mask from results using physical indices
  const bs = createBitSet(store.length);
  for (
    const { physicalIdx, passed } of evaluationResults as {
      physicalIdx: number;
      passed: boolean;
    }[]
  ) {
    if (passed && physicalIdx >= 0) {
      bitsetSet(bs, physicalIdx);
    }
  }

  // Handle existing views/masks

  const existingView = (df as any).__view;
  let finalMask = bs;
  if (existingView?.mask) {
    const combinedMask = createBitSet(store.length);
    for (let i = 0; i < store.length; i++) {
      if (bitsetGet(existingView.mask, i) && bitsetGet(bs, i)) {
        bitsetSet(combinedMask, i);
      }
    }
    finalMask = combinedMask;
  } else if (existingView?.rawMask) {
    const combinedMask = createBitSet(store.length);
    for (let i = 0; i < store.length; i++) {
      if (existingView.rawMask[i] && bitsetGet(bs, i)) {
        bitsetSet(combinedMask, i);
      }
    }
    finalMask = combinedMask;
  }

  const out = withMask(df, finalMask);
  rebuildFilteredGroups(df, out);
  return out;
}
