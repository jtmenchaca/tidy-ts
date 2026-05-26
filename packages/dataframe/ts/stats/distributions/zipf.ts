import {
  wasm_dzipf,
  wasm_pzipf,
  wasm_qzipf,
  wasm_rzipf,
} from "../../wasm/wasm-loader.ts";

// ===============================================================================
//                              ZIPF DISTRIBUTION
// ===============================================================================

export function dzipf({
  at,
  numberOfElements,
  exponent,
  returnLog = false,
}: {
  at: number;
  numberOfElements: number;
  exponent: number;
  returnLog?: boolean;
}): number {
  return wasm_dzipf(at, numberOfElements, exponent, returnLog);
}

export function pzipf({
  at,
  numberOfElements,
  exponent,
  direction = "below",
  returnLog = false,
}: {
  at: number;
  numberOfElements: number;
  exponent: number;
  direction?: "below" | "above";
  returnLog?: boolean;
}): number {
  const lowerTail = direction === "below";
  return wasm_pzipf(at, numberOfElements, exponent, lowerTail, returnLog);
}

export function qzipf({
  probability,
  numberOfElements,
  exponent,
  direction = "below",
  probabilityIsLog = false,
}: {
  probability: number;
  numberOfElements: number;
  exponent: number;
  direction?: "below" | "above";
  probabilityIsLog?: boolean;
}): number {
  const lowerTail = direction === "below";
  return wasm_qzipf(
    probability,
    numberOfElements,
    exponent,
    lowerTail,
    probabilityIsLog,
  );
}

export function rzipf(args: {
  numberOfElements: number;
  exponent: number;
  sampleSize: number;
  seed?: number;
}): number[];
export function rzipf(args: {
  numberOfElements: number;
  exponent: number;
  seed?: number;
}): number;
export function rzipf({
  numberOfElements,
  exponent,
  sampleSize,
  seed,
}: {
  numberOfElements: number;
  exponent: number;
  sampleSize?: number;
  seed?: number;
}): number | number[] {
  if (sampleSize === undefined) {
    return wasm_rzipf(numberOfElements, exponent, 1, seed)[0];
  }
  return wasm_rzipf(numberOfElements, exponent, sampleSize, seed);
}
