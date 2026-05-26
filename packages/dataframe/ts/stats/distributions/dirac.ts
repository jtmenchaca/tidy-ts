import {
  wasm_ddirac,
  wasm_pdirac,
  wasm_qdirac,
  wasm_rdirac,
} from "../../wasm/wasm-loader.ts";

// ===============================================================================
//                          DIRAC DELTA DISTRIBUTION
// ===============================================================================

export function ddirac({
  at,
  location = 0,
  returnLog = false,
}: {
  at: number;
  location?: number;
  returnLog?: boolean;
}): number {
  return wasm_ddirac(at, location, returnLog);
}

export function pdirac({
  at,
  location = 0,
  direction = "below",
  returnLog = false,
}: {
  at: number;
  location?: number;
  direction?: "below" | "above";
  returnLog?: boolean;
}): number {
  const lowerTail = direction === "below";
  return wasm_pdirac(at, location, lowerTail, returnLog);
}

export function qdirac({
  probability,
  location = 0,
  direction = "below",
  probabilityIsLog = false,
}: {
  probability: number;
  location?: number;
  direction?: "below" | "above";
  probabilityIsLog?: boolean;
}): number {
  const lowerTail = direction === "below";
  return wasm_qdirac(probability, location, lowerTail, probabilityIsLog);
}

export function rdirac(args: {
  location?: number;
  sampleSize: number;
  seed?: number;
}): number[];
export function rdirac(args?: {
  location?: number;
  seed?: number;
}): number;
export function rdirac({
  location = 0,
  sampleSize,
  seed,
}: {
  location?: number;
  sampleSize?: number;
  seed?: number;
} = {}): number | number[] {
  if (sampleSize === undefined) {
    return wasm_rdirac(location, 1, seed)[0];
  }
  return wasm_rdirac(location, sampleSize, seed);
}
