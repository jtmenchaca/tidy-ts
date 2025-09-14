// deno-lint-ignore-file no-explicit-any
import { initWasmFromBytes, left_join_typed_multi_u32 } from "./wasm-loader.ts";

type MsgIn = {
  wasmBytes: ArrayBuffer; // provided by main thread
  leftCols: Uint32Array[];
  rightCols: Uint32Array[];
  leftOffset: number; // shard start
};
type MsgOut = { leftIdx: Uint32Array; rightIdx: Uint32Array };

self.onmessage = (e: MessageEvent<MsgIn>) => {
  const { wasmBytes, leftCols, rightCols, leftOffset } = e.data;

  // Initialize WASM from provided bytes (idempotent)
  initWasmFromBytes(wasmBytes);

  const res = left_join_typed_multi_u32(leftCols, rightCols);
  const leftIdx = (res as any).takeLeft() as Uint32Array;
  const rightIdx = (res as any).takeRight() as Uint32Array;

  // Make indices global (required by your gather step)
  for (let i = 0; i < leftIdx.length; i++) leftIdx[i] += leftOffset;

  (self as any).postMessage({ leftIdx, rightIdx } as MsgOut, [
    leftIdx.buffer,
    rightIdx.buffer,
  ]);
};
