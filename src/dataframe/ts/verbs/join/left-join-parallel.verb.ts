// deno-lint-ignore-file no-explicit-any no-unused-vars require-await

import {
  createColumnarDataFrameFromStore,
  type DataFrame,
  type GroupedDataFrame,
  materializeIndex,
  type Prettify,
  withGroupsRebuilt,
} from "../../dataframe/index.ts";
import { convertToTypedArrays } from "../../dataframe/implementation/column-helpers.ts";
import { tracer } from "../../telemetry/tracer.ts";
// Note: Worker functionality removed - parallel joins disabled
// import { getWasmBytes } from "../../wasm/wasm-loader.ts";
import type { JoinKey, ObjectJoinOptions } from "./types/index.ts";

/**
 * Parallel left-join overview
 * ---------------------------
 * - Keeps the current single-threaded WASM path.
 * - Adds an opt-in parallel path that *hash partitions* BOTH sides by key (% workers).
 * - Each worker sees only its matching left/right partitions. No N× right replication.
 * - Worker protocol stays the same (leftCols/rightCols in, local indices out).
 *   We remap to global indices in the parent using per-partition index maps.
 * - Optional stable ordering: we radix-sort by left index after merge to preserve left order.
 */

const RIGHT_NULL: number = 0xFFFFFFFF; // must match the WASM/Rust sentinel (u32::MAX)

/* -------------------------------------------------------------------------- */
/* Config                                                                      */
/* -------------------------------------------------------------------------- */

const PAR_DEFAULT_WORKERS = (typeof navigator !== "undefined" &&
  (navigator as any).hardwareConcurrency) ||
  (typeof Deno !== "undefined" ? 4 : 4);

const PAR_MIN_LEFT_ROWS = 200_000; // heuristic: when to consider parallel
const PAR_MAX_WORKERS = 32;

// Module-level cache for typed arrays
const TA_CACHE = new WeakMap<object, Map<string, Uint32Array>>();

function getTypedColsCached(
  store: any,
  keys: string[],
): Record<string, Uint32Array> {
  let m = TA_CACHE.get(store);
  if (!m) {
    m = new Map();
    TA_CACHE.set(store, m);
  }
  const out: Record<string, Uint32Array> = Object.create(null);
  for (const k of keys) {
    let arr = m.get(k);
    if (!arr) {
      const typed = convertToTypedArrays(store.columns, [k] as any)[k];
      // assume convertToTypedArrays returns Uint32Array for join keys
      arr = typed as Uint32Array;
      m.set(k, arr);
    }
    out[k] = arr;
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* Helpers (shared)                                                            */
/* -------------------------------------------------------------------------- */

function getStoreAndIndex<Row extends Record<string, unknown>>(
  df: DataFrame<Row>,
) {
  const anyDf = df as any;
  const store = anyDf.__store;
  const view = anyDf.__view;
  const index = materializeIndex(store.length, view);
  return { store, index };
}

function parseJoinKeys(
  byOrOptions: any,
  options?: any,
): {
  leftKeys: string[];
  rightKeys: string[];
  suffixes: { left?: string; right?: string };
} {
  if (
    byOrOptions && typeof byOrOptions === "object" &&
    !Array.isArray(byOrOptions) && "keys" in byOrOptions
  ) {
    const opts = byOrOptions;
    if (Array.isArray(opts.keys)) {
      const keys = opts.keys.map(String);
      return { leftKeys: keys, rightKeys: keys, suffixes: opts.suffixes || {} };
    } else {
      const mapping = opts.keys;
      const leftKeys = Array.isArray(mapping.left)
        ? mapping.left.map(String)
        : [String(mapping.left)];
      const rightKeys = Array.isArray(mapping.right)
        ? mapping.right.map(String)
        : [String(mapping.right)];
      return { leftKeys, rightKeys, suffixes: opts.suffixes || {} };
    }
  }
  const keys = Array.isArray(byOrOptions)
    ? byOrOptions.map(String)
    : [String(byOrOptions)];
  return { leftKeys: keys, rightKeys: keys, suffixes: options?.suffixes || {} };
}

function allocLikeLeft(src: any, length: number): any {
  if (ArrayBuffer.isView(src) && !(src instanceof DataView)) {
    const Ctor = (src as any).constructor;
    try {
      return new Ctor(length);
    } catch {
      return new Array(length);
    }
  }
  return new Array(length);
}

function allocRightArray(length: number): unknown[] {
  return new Array(length);
}

function buildJoinResultOptimized(
  leftStore: any,
  rightStore: any,
  leftIndices: Uint32Array,
  rightIndices: Uint32Array,
  leftKeys: string[],
  suffixes: { left?: string; right?: string },
) {
  const n = leftIndices.length;

  const outCols: Record<string, any> = {};
  const outNames: string[] = [];

  const leftSuffix = suffixes.left ?? "";
  const rightSuffix = suffixes.right ?? "_y";

  const leftKeySet = new Set(leftKeys);
  const rightNameSet = new Set<string>(rightStore.columnNames as string[]);

  // ---------- Left columns ----------
  for (let c = 0; c < leftStore.columnNames.length; c++) {
    const name = leftStore.columnNames[c] as string;
    const isKey = leftKeySet.has(name);
    const hasConflict = !isKey && rightNameSet.has(name);
    const outName = hasConflict && leftSuffix ? `${name}${leftSuffix}` : name;

    outNames.push(outName);

    const src = leftStore.columns[name];
    const dst = allocLikeLeft(src, n);

    // Temporarily disable run-aware gathering to debug
    if (ArrayBuffer.isView(dst) && !(dst instanceof DataView)) {
      for (let i = 0; i < n; i++) (dst as any)[i] = src[leftIndices[i]];
    } else {
      for (let i = 0; i < n; i++) (dst as any[])[i] = src[leftIndices[i]];
    }
    outCols[outName] = dst;
  }

  // ---------- Right columns ----------
  const leftNameSet = new Set<string>(leftStore.columnNames as string[]);

  for (let c = 0; c < rightStore.columnNames.length; c++) {
    const name = rightStore.columnNames[c] as string;
    if (leftKeySet.has(name)) continue;

    const hasConflict = leftNameSet.has(name);
    const outName = hasConflict && rightSuffix ? `${name}${rightSuffix}` : name;

    outNames.push(outName);

    const src = rightStore.columns[name];
    const dst = allocRightArray(n);

    // Gather with NULL handling + runs of RIGHT_NULL or same r
    let i = 0;
    while (i < n) {
      const r = rightIndices[i]!;
      let j = i + 1;
      while (j < n && rightIndices[j] === r) j++;
      if (r === RIGHT_NULL) {
        for (let k = i; k < j; k++) (dst as any[])[k] = undefined;
      } else {
        const val = src[r];
        for (let k = i; k < j; k++) (dst as any[])[k] = val;
      }
      i = j;
    }

    outCols[outName] = dst;
  }

  return { columns: outCols, columnNames: outNames, length: n };
}

/* -------------------------------------------------------------------------- */
/* Parallel path (async, hash-partition both sides)                            */
/* -------------------------------------------------------------------------- */

export function shouldUseAsyncForJoin(nLeft: number, nRight: number): boolean {
  if (nLeft >= PAR_MIN_LEFT_ROWS) return true;
  const score = nLeft * Math.log2(Math.max(2, nRight));
  return score > 5e6;
}

/**
 * Parallel join factory — returns an async function (await like your async filter).
 * Uses hash partitioning so each worker receives only its matching right-partition.
 */
export function left_join_parallel<
  LeftRow extends Record<string, unknown>,
  RightRow extends Record<string, unknown>,
>(
  right: DataFrame<RightRow>,
  byOrOptions:
    | (JoinKey<LeftRow> & JoinKey<RightRow>)
    | Array<JoinKey<LeftRow> & JoinKey<RightRow>>
    | ObjectJoinOptions<LeftRow, RightRow>,
  options?: { suffixes?: { left?: string; right?: string }; workers?: number },
): (
  left: DataFrame<LeftRow>,
) => Promise<DataFrame<Prettify<LeftRow & Partial<RightRow>>>> {
  return async (left: DataFrame<LeftRow>) => {
    throw new Error(
      "Parallel joins are currently disabled due to worker functionality removal",
    );
    /*
    const overallStart = performance.now();
    const span = tracer.startSpan(left as any, "left_join_parallel");
    try {
      if (left.nrows() === 0) {
        tracer.addEvent(span, "early-return-empty-left");
        return createColumnarDataFrameFromStore({
          columns: {},
          length: 0,
          columnNames: [],
        }) as unknown as DataFrame<Prettify<LeftRow & Partial<RightRow>>>;
      }

      const { leftKeys, rightKeys, suffixes } = tracer.withSpan(
        left as any,
        "parse-join-keys",
        () => parseJoinKeys(byOrOptions, options),
      );

      // Create typed key columns
      const { leftColsAll, rightColsAll } = tracer.withSpan(
        left as any,
        "convert-to-typed-arrays",
        () => {
          const L = getStoreAndIndex(left);
          const R = getStoreAndIndex(right);
          const leftTypedAll = getTypedColsCached(L.store, leftKeys);
          const rightTypedAll = getTypedColsCached(R.store, rightKeys);
          const leftColsAll = leftKeys.map((k) =>
            leftTypedAll[k]
          ) as Uint32Array[];
          const rightColsAll = rightKeys.map((k) =>
            rightTypedAll[k]
          ) as Uint32Array[];
          return { leftColsAll, rightColsAll };
        },
      );

      const nLeft = leftColsAll[0]?.length ?? 0;
      const nRight = rightColsAll[0]?.length ?? 0;

      if (nLeft === 0 || nRight === 0) {
        const leftIdx = new Uint32Array(nLeft);
        for (let i = 0; i < nLeft; i++) leftIdx[i] = i >>> 0;
        const rightIdx = new Uint32Array(nLeft).fill(RIGHT_NULL >>> 0);
        return finalizeJoin(left, right, leftIdx, rightIdx, leftKeys, suffixes);
      }

      const requested = Math.min(
        Math.max(1, options?.workers ?? PAR_DEFAULT_WORKERS),
        PAR_MAX_WORKERS,
      );
      const workers = requested;
      const isPow2 = (workers & (workers - 1)) === 0;

      // Hash-partition BOTH sides (always builds a correct indexMap)
      const { parts: leftParts } = tracer.withSpan(
        left as any,
        "hash-partition-left",
        () =>
          isPow2
            ? hashPartitionFastFirstKey(leftColsAll, workers)
            : hashPartition(leftColsAll, workers),
      );
      const { parts: rightParts } = tracer.withSpan(
        left as any,
        "hash-partition-right",
        () =>
          isPow2
            ? hashPartitionFastFirstKey(rightColsAll, workers)
            : hashPartition(rightColsAll, workers),
      );

      // Each part carries: leftCols/rightCols and index maps (global row ids)
      // No worker changes required: workers return LOCAL row ids, we remap here.
      tracer.addEvent(span, "hash-partitioned", {
        workers,
        leftParts: leftParts.length,
        rightParts: rightParts.length,
        leftShardSizes: leftParts.map((p) => p.cols[0].length),
        rightShardSizes: rightParts.map((p) => p.cols[0].length),
      });

      const { wasmBytes, workerUrl, shardMsgs } = tracer.withSpan(
        left as any,
        "prepare-worker-messages",
        () => {
          // Worker functionality removed - throw error
          throw new Error("Parallel joins are currently disabled due to worker functionality removal");
          const workerUrl = new URL(
            "../../wasm-join-worker.ts",
            import.meta.url,
          );

          const shardMsgs = leftParts.map((lp, idx) => ({
            leftCols: lp.cols,
            rightCols: rightParts[idx].cols,
            leftMap: lp.indexMap, // global left row ids for this partition
            rightMap: rightParts[idx].indexMap, // global right row ids for this partition
            shardId: idx,
          }));
          return { wasmBytes, workerUrl, shardMsgs };
        },
      );

      console.log(`🚀 Starting parallel join with ${workers} workers`);
      console.log(
        `📊 Shard sizes:`,
        shardMsgs.map((msg, i) =>
          `Shard ${i}: ${msg.leftCols[0].length}L + ${msg.rightCols[0].length}R`
        ).join(", "),
      );

      const parts = await tracer.withSpan(
        left as any,
        "parallel-join-execution",
        async () => {
          const startTime = performance.now();
          const results = await Promise.all(
            shardMsgs.map(async (msg, idx) => {
              const shardStart = performance.now();
              const result = await runShardParallel(
                msg,
                workerUrl,
                wasmBytes,
                left,
              );
              const shardTime = performance.now() - shardStart;
              console.log(
                `✅ Shard ${idx} completed: ${result.leftIdx.length} results in ${
                  shardTime.toFixed(1)
                }ms`,
              );
              return result;
            }),
          );

          const totalTime = performance.now() - startTime;
          const totalResults = results.reduce(
            (sum, r) => sum + r.leftIdx.length,
            0,
          );
          console.log(
            `🎯 Parallel execution complete: ${totalResults} total results in ${
              totalTime.toFixed(1)
            }ms`,
          );

          return results;
        },
      );

      // Merge parts (already remapped to global ids inside runShardParallel)
      // Use k-way merge since each shard's output is already sorted by leftIdx
      const { leftIdxTA, rightIdxTA }: {
        leftIdxTA: Uint32Array;
        rightIdxTA: Uint32Array;
      } = tracer.withSpan(
        left as any,
        "merge-parallel-results",
        () => mergeKSortedByLeft(parts),
      );

      const result = tracer.withSpan(
        left as any,
        "finalize-join",
        () =>
          finalizeJoin(
            left,
            right,
            leftIdxTA,
            rightIdxTA,
            leftKeys,
            suffixes,
          ),
      );

      const overallTime = performance.now() - overallStart;
      console.log(`🔍 Overall timing: ${overallTime.toFixed(1)}ms`);

      return result;
    } finally {
      tracer.endSpan(left as any, span);
    }
    */
  };
}

/* -------------------------------------------------------------------------- */
/* Hash partitioning                                                           */
/* -------------------------------------------------------------------------- */

type Partition = {
  cols: Uint32Array[];
  indexMap: Uint32Array; // local->global row ids
};

type Partitions = {
  parts: Partition[];
  order: Uint32Array; // left global order (0..nLeft-1), useful for optional reordering
};

// light-weight 32-bit mix, good enough for partitioning
function mix32(x: number): number {
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d) >>> 0;
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b) >>> 0;
  x ^= x >>> 16;
  return x >>> 0;
}

function hashRow(cols: Uint32Array[], i: number): number {
  let h = 0x9e3779b9 >>> 0;
  for (let c = 0; c < cols.length; c++) {
    h = mix32(h ^ cols[c][i]);
  }
  return h >>> 0;
}

// Fast path: partition by first key + mask (power-of-two)
function hashPartitionFastFirstKey(
  cols: Uint32Array[],
  workersPow2: number,
): Partitions {
  const n = cols[0].length;
  const mask = workersPow2 - 1;
  const k0 = cols[0];

  const counts = new Uint32Array(workersPow2);

  // count
  for (let i = 0; i < n; i++) counts[mix32(k0[i]) & mask]++;

  // allocate
  const parts: Partition[] = new Array(workersPow2);
  const cursors = new Uint32Array(workersPow2);
  for (let p = 0; p < workersPow2; p++) {
    const len = counts[p] >>> 0;
    const colsP = cols.map(() => new Uint32Array(len));
    const mapP = new Uint32Array(len);
    parts[p] = { cols: colsP, indexMap: mapP };
  }

  // fill
  for (let i = 0; i < n; i++) {
    const p = mix32(k0[i]) & mask;
    const k = cursors[p]++;
    for (let c = 0; c < cols.length; c++) parts[p].cols[c][k] = cols[c][i];
    parts[p].indexMap[k] = i >>> 0;
  }

  // Debug logging for small datasets
  if (n <= 10) {
    console.log("🔍 Hash partitioning debug:", {
      originalKeys: Array.from(k0),
      parts: parts.map((part, idx) => ({
        shard: idx,
        keys: Array.from(part.cols[0]),
        indexMap: Array.from(part.indexMap),
      })),
    });
  }

  return { parts, order: new Uint32Array(0) }; // order not needed for k-way merge
}

function hashPartition(cols: Uint32Array[], workers: number): Partitions {
  const n = cols[0].length;
  const counts = new Uint32Array(workers);

  // Pass 1: counts
  for (let i = 0; i < n; i++) {
    const p = hashRow(cols, i) % workers;
    counts[p]++;
  }

  // Allocate
  const parts: Partition[] = new Array(workers);
  const cursors = new Uint32Array(workers);
  for (let p = 0; p < workers; p++) {
    const len = counts[p] >>> 0;
    const colsP = cols.map(() => new Uint32Array(len));
    const mapP = new Uint32Array(len); // local->global
    parts[p] = { cols: colsP, indexMap: mapP };
  }

  // Pass 2: fill by recomputing the same hash (no extra memory for p[i])
  for (let i = 0; i < n; i++) {
    const p = hashRow(cols, i) % workers;
    const k = cursors[p]++;
    for (let c = 0; c < cols.length; c++) parts[p].cols[c][k] = cols[c][i];
    parts[p].indexMap[k] = i >>> 0;
  }

  // Capture original order if needed later
  const order = new Uint32Array(n);
  for (let i = 0; i < n; i++) order[i] = i >>> 0;

  return { parts, order };
}

/* -------------------------------------------------------------------------- */
/* Parallel helpers                                                            */
/* -------------------------------------------------------------------------- */

type ShardMsg = {
  leftCols: Uint32Array[];
  rightCols: Uint32Array[];
  leftMap: Uint32Array; // local->global (left)
  rightMap: Uint32Array; // local->global (right)
  shardId: number;
};

type WorkerMsgOut = { leftIdx: Uint32Array; rightIdx: Uint32Array };

function mergeKSortedByLeft(parts: WorkerMsgOut[]) {
  let total = 0;
  for (const p of parts) total += p.leftIdx.length;

  const outL = new Uint32Array(total);
  const outR = new Uint32Array(total);

  const k = parts.length;
  const heads = new Uint32Array(k); // current offset for each part

  // min-heap over part indices, ordered by current leftIdx
  const heap = new Uint16Array(k);
  let hsize = 0;

  const less = (aIdx: number, bIdx: number) => {
    const a = heap[aIdx]!, b = heap[bIdx]!;
    const la = parts[a].leftIdx[heads[a]]!;
    const lb = parts[b].leftIdx[heads[b]]!;
    return la < lb || (la === lb && a < b);
  };
  const swap = (i: number, j: number) => {
    const t = heap[i]!;
    heap[i] = heap[j]!;
    heap[j] = t;
  };

  const heapUp = (i: number) => {
    while (i) {
      const p = (i - 1) >>> 1;
      if (!less(i, p)) break;
      swap(i, p);
      i = p;
    }
  };
  const heapDown = (i: number) => {
    while (true) {
      const l = (i << 1) + 1;
      const r = l + 1;
      let m = i;
      if (l < hsize && less(l, m)) m = l;
      if (r < hsize && less(r, m)) m = r;
      if (m === i) break;
      swap(i, m);
      i = m;
    }
  };

  // init heap with non-empty parts
  for (let p = 0; p < k; p++) {
    if (parts[p].leftIdx.length) {
      heap[hsize++] = p;
      heapUp(hsize - 1);
    }
  }

  let o = 0;
  while (hsize) {
    const top = heap[0]!;
    const i = heads[top]++;

    outL[o] = parts[top].leftIdx[i]!;
    outR[o] = parts[top].rightIdx[i]!;
    o++;

    if (heads[top] < parts[top].leftIdx.length) {
      heapDown(0);
    } else {
      heap[0] = heap[--hsize]!;
      if (hsize) heapDown(0);
    }
  }

  return { leftIdxTA: outL, rightIdxTA: outR };
}

async function runShardParallel(
  msg: ShardMsg,
  workerUrl: URL,
  wasmBytes: ArrayBufferLike,
  _leftDf: any,
): Promise<WorkerMsgOut> {
  const worker = await spawnPortableWorker(workerUrl);
  try {
    const done = new Promise<WorkerMsgOut>((resolve, reject) => {
      (worker as any).onmessage = (e: MessageEvent<WorkerMsgOut>) =>
        resolve(e.data);
      (worker as any).onerror = (e: any) => reject(e);
    });

    // NO cloning — just gather transferables
    const transfers: ArrayBuffer[] = [];
    for (const a of msg.leftCols) transfers.push(a.buffer as ArrayBuffer);
    for (const a of msg.rightCols) transfers.push(a.buffer as ArrayBuffer);

    (worker as any).postMessage(
      { wasmBytes, leftCols: msg.leftCols, rightCols: msg.rightCols },
      transfers as any, // Node bridge accepts this
    );

    const outLocal = await done;

    // Remap local indices to GLOBAL row ids using the maps for this partition
    const m = outLocal.leftIdx.length;
    const leftGlobal = new Uint32Array(m);
    const rightGlobal = new Uint32Array(m);

    const lmap = msg.leftMap;
    const rmap = msg.rightMap;

    for (let i = 0; i < m; i++) {
      const li = outLocal.leftIdx[i]!;
      const ri = outLocal.rightIdx[i]!;
      leftGlobal[i] = lmap[li]!;
      rightGlobal[i] = (ri === RIGHT_NULL) ? RIGHT_NULL : rmap[ri]!;
    }

    // Debug logging for small datasets
    if (m <= 10) {
      console.log(`🔍 Shard ${msg.shardId} mapping:`, {
        localLeft: Array.from(outLocal.leftIdx),
        localRight: Array.from(outLocal.rightIdx),
        leftMap: Array.from(lmap),
        rightMap: Array.from(rmap),
        globalLeft: Array.from(leftGlobal),
        globalRight: Array.from(rightGlobal),
      });
    }

    return { leftIdx: leftGlobal, rightIdx: rightGlobal };
  } finally {
    (worker as any).terminate?.();
  }
}

/**
 * Spawn a Worker in Bun/Deno (global Worker) or Node (worker_threads).
 */
async function spawnPortableWorker(workerUrl: URL): Promise<any> {
  // Bun / Deno / Browser-like
  if (typeof (globalThis as any).Worker === "function") {
    return new (globalThis as any).Worker(workerUrl.href, { type: "module" });
  }

  // Node: worker_threads
  const { Worker: NodeWorker } = await import("node:worker_threads");
  const nodeWorker = new (NodeWorker as any)(workerUrl, { type: "module" });

  // Bridge to a "web-like" interface
  const wrapper: any = {
    postMessage: (msg: any, transfer?: ArrayBuffer[]) =>
      nodeWorker.postMessage(msg, transfer as any),
    terminate: () => nodeWorker.terminate(),
    onmessage: null as ((e: MessageEvent) => void) | null,
    onerror: null as ((e: any) => void) | null,
  };

  nodeWorker.on("message", (data: any) => wrapper.onmessage?.({ data } as any));
  nodeWorker.on("error", (err: any) => wrapper.onerror?.(err));
  return wrapper;
}

/* -------------------------------------------------------------------------- */
/* Finalize result (sync; avoids require-await)                                */
/* -------------------------------------------------------------------------- */

function finalizeJoin<
  LeftRow extends Record<string, unknown>,
  RightRow extends Record<string, unknown>,
>(
  left: DataFrame<LeftRow>,
  right: DataFrame<RightRow>,
  leftIdxTA: Uint32Array,
  rightIdxTA: Uint32Array,
  leftKeys: string[],
  suffixes: { left?: string; right?: string } | undefined,
): DataFrame<Prettify<LeftRow & Partial<RightRow>>> {
  const L = getStoreAndIndex(left);
  const R = getStoreAndIndex(right);

  const outStore = buildJoinResultOptimized(
    L.store,
    R.store,
    leftIdxTA,
    rightIdxTA,
    leftKeys,
    suffixes || {},
  );

  const outDf = createColumnarDataFrameFromStore(
    outStore,
  ) as unknown as DataFrame<
    Prettify<LeftRow & Partial<RightRow>>
  >;

  if ((left as any).__groups) {
    const src = left as unknown as GroupedDataFrame<LeftRow, keyof LeftRow>;
    const outRows = (outDf as DataFrame<LeftRow>)
      .toArray() as readonly LeftRow[];
    const rebuilt = withGroupsRebuilt(
      src,
      outRows as any,
      outDf as any,
    ) as unknown as DataFrame<
      Prettify<LeftRow & Partial<RightRow>>
    >;
    (rebuilt as any).__groups = (left as any).__groups;
    tracer.copyContext(left as any, rebuilt as any);
    return rebuilt;
  }

  tracer.copyContext(left as any, outDf as any);
  return outDf;
}
