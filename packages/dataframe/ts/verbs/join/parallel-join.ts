// deno-lint-ignore-file no-explicit-any
import { tracer } from "../../telemetry/tracer.ts";

type Shard = {
  start: number;
  end: number;
  leftCols: Uint32Array[]; // copies for this shard
  offset: number;
};

function pickWorkers(nRows: number, requested?: number) {
  const minChunk = 200_000; // avoid tiny shards
  const maxBySize = Math.max(1, Math.floor(nRows / minChunk));
  const envWorkers = (() => {
    try {
      // optional, if running under Deno with env available
      const w = (globalThis as any)?.Deno?.env?.get?.("TIDY_TS_JOIN_WORKERS");
      return w ? Math.max(1, Number(w) | 0) : undefined;
    } catch {
      return undefined;
    }
  })();

  const hw = (globalThis as any)?.navigator?.hardwareConcurrency ||
    (globalThis as any)?.Deno?.systemCpuInfo?.()?.cores ||
    4;

  const target = requested ?? envWorkers ?? hw;
  return Math.max(1, Math.min(target, maxBySize));
}

function makeShards(
  leftCols: Uint32Array[],
  nRows: number,
  workers: number,
): Shard[] {
  const step = Math.ceil(nRows / workers);
  const shards: Shard[] = [];
  for (let start = 0; start < nRows; start += step) {
    const end = Math.min(nRows, start + step);
    // Copy each column's slice so we can transfer just the chunk
    const leftChunk = leftCols.map((col) => col.slice(start, end));
    shards.push({ start, end, leftCols: leftChunk, offset: start });
  }
  return shards;
}

async function runShard(
  shard: Shard,
  rightCols: Uint32Array[],
  workerUrl: URL,
): Promise<{ leftIdx: Uint32Array; rightIdx: Uint32Array }> {
  const worker = new Worker(workerUrl.href, {
    type: "module",
    deno: { permissions: "inherit" }, // allows reading the WASM file in the worker
  });
  try {
    const msg = new Promise<{ leftIdx: Uint32Array; rightIdx: Uint32Array }>(
      (resolve, reject) => {
        worker.onmessage = (e) => resolve(e.data);
        worker.onerror = (e) => reject(e);
      },
    );

    // Don’t transfer right columns; let the worker clone them (simpler + safe).
    // If right is big and W is large, you can micro-opt: rightCols.map(c => c.slice())
    worker.postMessage({
      leftCols: shard.leftCols,
      rightCols,
      leftOffset: shard.offset,
    }, shard.leftCols.map((c) => c.buffer)); // transfer left chunks

    return await msg;
  } finally {
    worker.terminate();
  }
}

function concatU32(chunks: Uint32Array[], total?: number): Uint32Array {
  const totalLen = total ?? chunks.reduce((s, a) => s + a.length, 0);
  const out = new Uint32Array(totalLen);
  let off = 0;
  for (const a of chunks) {
    out.set(a, off);
    off += a.length;
  }
  return out;
}

export async function parallelLeftJoinIndices(
  leftCols: Uint32Array[],
  rightCols: Uint32Array[],
  opts?: { workers?: number },
): Promise<{ leftIdxTA: Uint32Array; rightIdxTA: Uint32Array }> {
  const nLeft = leftCols[0]?.length ?? 0;
  if (nLeft === 0) {
    return { leftIdxTA: new Uint32Array(0), rightIdxTA: new Uint32Array(0) };
  }

  const W = pickWorkers(nLeft, opts?.workers);
  if (W <= 1) {
    // fall back to single-worker path by just importing the worker once:
    const workerUrl = new URL("./wasm_join.worker.ts", import.meta.url);
    const res = await runShard(
      {
        start: 0,
        end: nLeft,
        leftCols: leftCols.map((c) => c.slice()),
        offset: 0,
      },
      rightCols,
      workerUrl,
    );
    return { leftIdxTA: res.leftIdx, rightIdxTA: res.rightIdx };
  }

  const workerUrl = new URL("./wasm_join.worker.ts", import.meta.url);
  const shards = makeShards(leftCols, nLeft, W);

  const t0 = performance.now();
  const parts = await Promise.all(
    shards.map((s) => runShard(s, rightCols, workerUrl)),
  );
  const t1 = performance.now();
  tracer.addEvent({} as any, "parallel-workers-finished", {
    workers: W,
    shards: shards.length,
    ms: +(t1 - t0).toFixed(3),
  });

  // Concatenate
  const leftIdxTA = concatU32(parts.map((p) => p.leftIdx));
  const rightIdxTA = concatU32(parts.map((p) => p.rightIdx));
  return { leftIdxTA, rightIdxTA };
}
