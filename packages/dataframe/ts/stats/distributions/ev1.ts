import {
  wasm_dev1,
  wasm_pev1,
  wasm_qev1,
  wasm_rev1,
} from "../../wasm/wasm-loader.ts";
import type { DataFrame } from "../../dataframe/index.ts";
import { createDistributionData } from "./data-helper.ts";

// ===============================================================================
//                        EV1 / GUMBEL (MAXIMUM) DISTRIBUTION
// ===============================================================================

export function dev1({
  at,
  location = 0,
  scale = 1,
  returnLog = false,
}: {
  at: number;
  location?: number;
  scale?: number;
  returnLog?: boolean;
}): number {
  return wasm_dev1(at, location, scale, returnLog);
}

export function pev1({
  at,
  location = 0,
  scale = 1,
  direction = "below",
  returnLog = false,
}: {
  at: number;
  location?: number;
  scale?: number;
  direction?: "below" | "above";
  returnLog?: boolean;
}): number {
  const lowerTail = direction === "below";
  return wasm_pev1(at, location, scale, lowerTail, returnLog);
}

export function qev1({
  probability,
  location = 0,
  scale = 1,
  direction = "below",
  probabilityIsLog = false,
}: {
  probability: number;
  location?: number;
  scale?: number;
  direction?: "below" | "above";
  probabilityIsLog?: boolean;
}): number {
  const lowerTail = direction === "below";
  return wasm_qev1(probability, location, scale, lowerTail, probabilityIsLog);
}

export function rev1({
  location,
  scale,
}: {
  location?: number;
  scale?: number;
}): number;
export function rev1({
  location,
  scale,
  sampleSize,
}: {
  location?: number;
  scale?: number;
  sampleSize: number;
}): number[];
export function rev1({
  location = 0,
  scale = 1,
  sampleSize = 1,
}: {
  location?: number;
  scale?: number;
  sampleSize?: number;
}): number | number[] {
  if (sampleSize === 1) return wasm_rev1(location, scale);

  const results: number[] = [];
  for (let i = 0; i < sampleSize; i++) {
    results.push(wasm_rev1(location, scale));
  }
  return results;
}

export function ev1Data({
  location,
  scale,
  type,
  range,
  points,
}: {
  location?: number;
  scale?: number;
  type: "pdf";
  range?: [number, number];
  points?: number;
}): DataFrame<{ x: number; density: number }>;
export function ev1Data({
  location,
  scale,
  type,
  range,
  points,
}: {
  location?: number;
  scale?: number;
  type: "cdf";
  range?: [number, number];
  points?: number;
}): DataFrame<{ x: number; probability: number }>;
export function ev1Data({
  location,
  scale,
  type,
  range,
  points,
}: {
  location?: number;
  scale?: number;
  type: "inverse_cdf";
  range?: [number, number];
  points?: number;
}): DataFrame<{ probability: number; quantile: number }>;
export function ev1Data({
  location = 0,
  scale = 1,
  type,
  range,
  points = 100,
}: {
  location?: number;
  scale?: number;
  type: "pdf" | "cdf" | "inverse_cdf";
  range?: [number, number];
  points?: number;
}): any {
  const defaultRange: [number, number] = [
    location - 4 * scale,
    location + 6 * scale,
  ];

  if (type === "pdf") {
    return createDistributionData({
      distribution: { density: dev1, probability: pev1, quantile: qev1 },
      params: { location, scale },
      type: "pdf",
      config: { range: range ?? defaultRange, points },
    });
  } else if (type === "cdf") {
    return createDistributionData({
      distribution: { density: dev1, probability: pev1, quantile: qev1 },
      params: { location, scale },
      type: "cdf",
      config: { range: range ?? defaultRange, points },
    });
  } else {
    return createDistributionData({
      distribution: { density: dev1, probability: pev1, quantile: qev1 },
      params: { location, scale },
      type: "inverse_cdf",
      config: { range, points },
    });
  }
}
