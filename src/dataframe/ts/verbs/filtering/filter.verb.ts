// deno-lint-ignore-file no-explicit-any
import type {
  DataFrame,
  GroupedDataFrame,
  Prettify,
} from "../../dataframe/index.ts";
import {
  bitsetClear,
  bitsetGet,
  bitsetSet,
  createBitSet,
} from "../../dataframe/implementation/columnar-view.ts";
import { withMask } from "../../dataframe/implementation/row-cursor.ts";
import {
  // numeric/date WASM only; string WASM stays disabled (too much overhead)
  batch_filter_numbers,
} from "../../wasm/wasm-loader.ts";
import {
  returnsPromise,
  shouldUseAsyncForFilter,
} from "../../promised-dataframe/index.ts";
import {
  type ConcurrencyOptions,
  DEFAULT_CONCURRENCY,
  processConcurrently,
} from "../../promised-dataframe/concurrency-utils.ts";
import { tracer } from "../../telemetry/tracer.ts";

export type Predicate<Row extends object> =
  | ((row: Row, idx: number, df: DataFrame<Row>) => boolean | null | undefined)
  | ReadonlyArray<boolean | null | undefined>;

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

type OptimizedPredicate = (
  rowIndex: number,
  columns: Record<string, unknown[]>,
) => boolean;

/* -------------------------------------------------------------------------- */
/* Tunables                                                                   */
/* -------------------------------------------------------------------------- */
const ENABLE_WASM_NUMERIC = true;
const WASM_MIN_ROWS_NUMERIC = Infinity; // below this, JS tends to be faster

/* -------------------------------------------------------------------------- */
/* Public API                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Filter rows based on one or more predicates.
 *
 * @example
 * // Sync filtering
 * df.filter(row => row.age > 18)
 *
 * @example
 * // Multiple predicates (AND logic)
 * df.filter(
 *   row => row.age > 18,
 *   row => row.status === "active"
 * )
 *
 * @example
 * // Async filtering with concurrency
 * df.filter(
 *   async (row) => await validateUser(row.id),
 *   { concurrency: 10 }
 * )
 *
 * @example
 * // Boolean array predicate
 * df.filter([true, false, true, false])
 */
export function filter<Row extends object>(
  predicate: (
    row: Row,
    idx: number,
    df: DataFrame<Row>,
  ) => Promise<boolean | null | undefined>,
  options?: ConcurrencyOptions,
): (df: DataFrame<Row>) => Promise<DataFrame<Prettify<Row>>>;

/**
 * Filter rows based on one or more predicates.
 *
 * @example
 * // Sync filtering
 * df.filter(row => row.age > 18)
 *
 * @example
 * // Multiple predicates (AND logic)
 * df.filter(
 *   row => row.age > 18,
 *   row => row.status === "active"
 * )
 *
 * @example
 * // Async filtering with concurrency
 * df.filter(
 *   async (row) => await validateUser(row.id),
 *   { concurrency: 10 }
 * )
 *
 * @example
 * // Boolean array predicate
 * df.filter([true, false, true, false])
 */
export function filter<Row extends object>(
  predicates: Array<
    | ((
      row: Row,
      idx: number,
      df: DataFrame<Row>,
    ) => Promise<boolean | null | undefined>)
    | ((
      row: Row,
      idx: number,
      df: DataFrame<Row>,
    ) => boolean | null | undefined)
    | ReadonlyArray<boolean | null | undefined>
  >,
  options?: ConcurrencyOptions,
): (df: DataFrame<Row>) => Promise<DataFrame<Prettify<Row>>>;

/**
 * Filter rows based on one or more predicates.
 *
 * @example
 * // Sync filtering
 * df.filter(row => row.age > 18)
 *
 * @example
 * // Multiple predicates (AND logic)
 * df.filter(
 *   row => row.age > 18,
 *   row => row.status === "active"
 * )
 *
 * @example
 * // Async filtering with concurrency
 * df.filter(
 *   async (row) => await validateUser(row.id),
 *   { concurrency: 10 }
 * )
 *
 * @example
 * // Boolean array predicate
 * df.filter([true, false, true, false])
 */
export function filter<Row extends object>(
  predicate: (
    row: Row,
    idx: number,
    df: DataFrame<Row>,
  ) => boolean | null | undefined,
  options: ConcurrencyOptions,
): (df: DataFrame<Row>) => Promise<DataFrame<Prettify<Row>>>;

/**
 * Filter rows based on one or more predicates.
 *
 * @example
 * // Sync filtering
 * df.filter(row => row.age > 18)
 *
 * @example
 * // Multiple predicates (AND logic)
 * df.filter(
 *   row => row.age > 18,
 *   row => row.status === "active"
 * )
 *
 * @example
 * // Async filtering with concurrency
 * df.filter(
 *   async (row) => await validateUser(row.id),
 *   { concurrency: 10 }
 * )
 *
 * @example
 * // Boolean array predicate
 * df.filter([true, false, true, false])
 */
export function filter<Row extends object>(
  ...predicates: Array<
    | ((
      row: Row,
      idx: number,
      df: DataFrame<Row>,
    ) => boolean | null | undefined)
    | ReadonlyArray<boolean | null | undefined>
  >
): (df: DataFrame<Row>) => DataFrame<Prettify<Row>>;

// Implementation
export function filter<Row extends object>(
  ...args: any[]
): any {
  return (df: DataFrame<Row>): any => {
    // Handle both old (...predicates) and new (predicates, options) signatures
    let predicates: any[];
    let options: ConcurrencyOptions | undefined;

    // Check if last argument is a ConcurrencyOptions object
    const lastArg = args[args.length - 1];
    const isLastArgOptions = lastArg &&
      typeof lastArg === "object" &&
      !Array.isArray(lastArg) &&
      !("length" in lastArg) && // Not a predicate array
      (lastArg.concurrency !== undefined || lastArg.batchSize !== undefined ||
        lastArg.retry !== undefined);

    if (isLastArgOptions) {
      // Last argument is options, everything else is predicates
      predicates = args.slice(0, -1);
      options = lastArg as ConcurrencyOptions;
    } else {
      // All arguments are predicates (original behavior)
      predicates = args;
      options = undefined;
    }

    // Check if any predicates are async or if options are provided
    const isAsync = shouldUseAsyncForFilter(df, predicates) ||
      (options !== undefined);

    if (isAsync) {
      // Get DataFrame's default options if available
      const dfOptions = (df as any).__options as ConcurrencyOptions | undefined;
      // Apply default concurrency if no options provided
      const concurrencyOptions = options || dfOptions ||
        DEFAULT_CONCURRENCY.filter;
      return filterRowsAsync(df, predicates, concurrencyOptions);
    } else {
      return filterRowsSync(df, predicates as Predicate<Row>[]);
    }
  };
}

// Sync implementation (original logic)
function filterRowsSync<Row extends object>(
  df: DataFrame<Row>,
  predicates: Predicate<Row>[],
): DataFrame<Prettify<Row>> {
  const span = tracer.startSpan(df, "filter", {
    predicates: predicates.length,
  });

  try {
    const api = df as any;
    const store = api.__store;
    const nRowsFull = store.length;

    // Numeric/date WASM fast-path for very large unmasked, unindexed frames
    if (
      ENABLE_WASM_NUMERIC && nRowsFull >= WASM_MIN_ROWS_NUMERIC &&
      isPlainFrame(api)
    ) {
      console.log("\n\n----- WASM fast-path -----\n\n");
      try {
        const wasmMask = tryWasmFilterPathNumericOnly(df, predicates);
        if (wasmMask) {
          const bs = maskToBitset(wasmMask, nRowsFull);
          const out = withMask(df as DataFrame<Row>, bs) as DataFrame<
            Prettify<Row>
          >;
          if ((df as GroupedDataFrame<Row, keyof Row>).__groups) {
            (out as any).__groups = (df as any).__groups;
            tracer.copyContext(df, out);
            return out as unknown as GroupedDataFrame<
              Prettify<Row>,
              keyof Prettify<Row>
            >;
          }
          tracer.copyContext(df, out);
          return out;
        }
        console.log("\n\n----- wasmMask is null -----\n\n");
      } catch {
        console.log("\n\n----- WASM fast-path failed -----\n\n");
        /* fall through to JS path */
      }
    }

    // JS path: build AND mask directly in a BitSet (Arquero-style)
    const bs = tracer.withSpan(df, "compute-filter-mask", () => {
      const bitset = createBitSet(nRowsFull);
      computeFilterMaskDirectly_AND(df, predicates, bitset);
      return bitset;
    });

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
      return bs;
    });

    const out = tracer.withSpan(df, "create-filtered-dataframe", () => {
      return withMask(df as DataFrame<Row>, finalMask) as DataFrame<
        Prettify<Row>
      >;
    });

    // Copy trace context to new DataFrame
    tracer.copyContext(df, out);

    if ((df as GroupedDataFrame<Row, keyof Row>).__groups) {
      (out as any).__groups = (df as any).__groups;
      return out as unknown as GroupedDataFrame<
        Prettify<Row>,
        keyof Prettify<Row>
      >;
    }
    return out;
  } finally {
    tracer.endSpan(df, span);
  }
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function isPlainFrame(api: any): boolean {
  // Heuristic: only take numeric WASM fast path if there is no existing mask or index mapping.
  // (Direct column scans assume row index === storage index.)
  return !api?.__mask && !api?.__index && !api?.__slice;
}

function maskToBitset(mask: Uint8Array, n: number): any {
  const bs = createBitSet(n);
  for (let i = 0; i < n; i++) if (mask[i]) bitsetSet(bs, i);
  return bs;
}

function andMasksInPlace(target: Uint8Array, src: Uint8Array): void {
  const n = target.length;
  for (let i = 0; i < n; i++) target[i] &= src[i];
}

/* -------------------------------------------------------------------------- */
/* WASM (numeric-only)                                                         */
/* -------------------------------------------------------------------------- */
function tryWasmFilterPathNumericOnly<Row extends object>(
  df: DataFrame<Row>,
  predicates: Predicate<Row>[],
): Uint8Array | null {
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

    const op = detectSimplePredicate(
      pred as (
        row: Row,
        idx: number,
        df: DataFrame<Row>,
      ) => boolean | null | undefined,
    );
    if (!op) return null;

    // Keep string/nullcheck off this path (we bail to JS)
    if (op.kind !== "number" && op.kind !== "date") return null;

    const col = store.columns[op.column] as unknown[];
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

    const code = opToCode(op.operator);
    if (code == null || Number.isNaN(op.value)) return null;

    const out = new Uint8Array(n);
    batch_filter_numbers(values, op.value, code, out);
    andMasksInPlace(mask, out);
    didWasm = true;
  }

  return didWasm ? mask : null;
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

function detectSimplePredicate<Row extends object>(
  pred: (
    row: Row,
    idx: number,
    df: DataFrame<Row>,
  ) => boolean | null | undefined,
): DetectedOp | null {
  const s = String(pred);

  // Reject compound conditions (contains && or ||)
  if (s.includes("&&") || s.includes("||")) {
    return null;
  }

  // null checks
  {
    const m = /row\.(\w+)\s*([!]?=)\s*null/.exec(s);
    if (m) {
      const column = m[1];
      const op = m[2] === "==" ? "== null" : "!= null";
      return {
        kind: "nullcheck",
        column,
        operator: op as "== null" | "!= null",
      };
    }
  }

  // string equality / inequality
  {
    const eq = /row\.(\w+)\s*(===|==|!==|!=)\s*(['"])(.*?)\3/.exec(s);
    if (eq) {
      const [, column, operator, , val] = eq;

      return { kind: "string", column, operator: operator as any, value: val };
    }
  }

  // numeric / date compares against numeric literal
  {
    const cmp = /row\.(\w+)\s*(>=|<=|>|<|===|==|!==|!=)\s*([+\d][\d._eE+-]*)/
      .exec(s);
    if (cmp) {
      const column = cmp[1], operator = cmp[2], raw = cmp[3];
      const value = Number(raw);
      if (!Number.isNaN(value)) {
        return { kind: "number", column, operator, value };
      }
    }
  }

  return null;
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

/* -------------------------------------------------------------------------- */
/* JS path: direct BitSet with correct AND semantics                           */
/* -------------------------------------------------------------------------- */
function computeFilterMaskDirectly_AND<Row extends object>(
  df: DataFrame<Row>,
  preds: Predicate<Row>[],
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

    // Fast paths only for plain frames (unchanged)
    const plain = isPlainFrame(api);

    const simple = plain ? detectSimplePredicate(pred as any) : null;
    if (plain && simple?.kind === "string") {
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
    const compoundOptimized = plain
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

    const optimized = plain
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
    if (first) {
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

function tryOptimizeCompoundPredicate<Row extends object>(
  pred: (
    row: Row,
    idx: number,
    df: DataFrame<Row>,
  ) => boolean | null | undefined,
  columnNames: string[],
): OptimizedPredicate | null {
  try {
    const s = String(pred);

    // Only handle simple AND compounds for now
    if (!s.includes("&&") || s.includes("||")) {
      return null;
    }

    // Extract the body after the arrow function
    const bodyMatch = /=>\s*(.+)/.exec(s);
    if (!bodyMatch) {
      return null;
    }

    const body = bodyMatch[1];
    const andClauses = body.split("&&").map((clause) => clause.trim());
    const optimizedClauses: Array<
      (i: number, cols: Record<string, unknown[]>) => boolean
    > = [];

    for (const clause of andClauses) {
      // Try numeric comparison
      const numMatch =
        /row\.(\w+)\s*(>=|<=|>|<|===|==|!==|!=)\s*([+\d][\d._eE+-]*)/.exec(
          clause,
        );
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
              return null; // Unsupported operator
          }
          continue;
        }
      }

      // Try string comparison
      const strMatch = /row\.(\w+)\s*(===|==|!==|!=)\s*['"]([^'"]*?)['"]/.exec(
        clause,
      );
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

      // Try boolean field access like row.active
      const boolMatch = /^row\.(\w+)$/.exec(clause);
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

function tryOptimizeNumericPredicate<Row extends object>(
  pred: (
    row: Row,
    idx: number,
    df: DataFrame<Row>,
  ) => boolean | null | undefined,
  columnNames: string[],
): OptimizedPredicate | null {
  try {
    const s = String(pred);

    // CRITICAL: Must reject compound conditions BEFORE attempting to match
    // This prevents incorrect optimization of compound predicates like:
    // (row) => row.height > 180 && row.species === "Human"
    // which would otherwise be optimized to only check height > 180
    if (s.includes("&&") || s.includes("||")) {
      return null;
    }

    const m =
      /(?:\(row\)|row)\s*=>\s*row\.(\w+)\s*(>=|<=|>|<|===|==|!==|!=)\s*([+\d][\d._eE+-]*)/
        .exec(s);
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

  return logicalIndex;
}

// Async implementation with concurrency control
async function filterRowsAsync<Row extends object>(
  df: DataFrame<Row>,
  predicates: any[],
  options: ConcurrencyOptions = DEFAULT_CONCURRENCY.filter,
): Promise<DataFrame<Prettify<Row>>> {
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
  }

  const out = withMask(df as DataFrame<Row>, finalMask) as DataFrame<
    Prettify<Row>
  >;
  if ((df as GroupedDataFrame<Row, keyof Row>).__groups) {
    (out as any).__groups = (df as any).__groups;
    return out as unknown as GroupedDataFrame<
      Prettify<Row>,
      keyof Prettify<Row>
    >;
  }
  return out;
}
