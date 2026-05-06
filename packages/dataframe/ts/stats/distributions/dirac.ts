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

export function rdirac({
  location,
}: {
  location?: number;
}): number;
export function rdirac({
  location,
  sampleSize,
}: {
  location?: number;
  sampleSize: number;
}): number[];
export function rdirac({
  location = 0,
  sampleSize = 1,
}: {
  location?: number;
  sampleSize?: number;
}): number | number[] {
  if (sampleSize === 1) return wasm_rdirac(location);

  return Array.from({ length: sampleSize }, () => wasm_rdirac(location));
}
