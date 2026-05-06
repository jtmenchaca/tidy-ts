import {
  wasm_dpareto,
  wasm_ppareto,
  wasm_qpareto,
  wasm_rpareto,
} from "../../wasm/wasm-loader.ts";
import type { DataFrame } from "../../dataframe/index.ts";
import { createDistributionData } from "./data-helper.ts";

// ===============================================================================
//                               PARETO DISTRIBUTION
// ===============================================================================

export function dpareto({
  at,
  scale,
  shape,
  returnLog = false,
}: {
  at: number;
  scale: number;
  shape: number;
  returnLog?: boolean;
}): number {
  return wasm_dpareto(at, scale, shape, returnLog);
}

export function ppareto({
  at,
  scale,
  shape,
  direction = "below",
  returnLog = false,
}: {
  at: number;
  scale: number;
  shape: number;
  direction?: "below" | "above";
  returnLog?: boolean;
}): number {
  const lowerTail = direction === "below";
  return wasm_ppareto(at, scale, shape, lowerTail, returnLog);
}

export function qpareto({
  probability,
  scale,
  shape,
  direction = "below",
  probabilityIsLog = false,
}: {
  probability: number;
  scale: number;
  shape: number;
  direction?: "below" | "above";
  probabilityIsLog?: boolean;
}): number {
  const lowerTail = direction === "below";
  return wasm_qpareto(probability, scale, shape, lowerTail, probabilityIsLog);
}

export function rpareto({
  scale,
  shape,
}: {
  scale: number;
  shape: number;
}): number;
export function rpareto({
  scale,
  shape,
  sampleSize,
}: {
  scale: number;
  shape: number;
  sampleSize: number;
}): number[];
export function rpareto({
  scale,
  shape,
  sampleSize = 1,
}: {
  scale: number;
  shape: number;
  sampleSize?: number;
}): number | number[] {
  if (sampleSize === 1) return wasm_rpareto(scale, shape);

  const results: number[] = [];
  for (let i = 0; i < sampleSize; i++) {
    results.push(wasm_rpareto(scale, shape));
  }
  return results;
}

export function paretoData({
  scale,
  shape,
  type,
  range,
  points,
}: {
  scale: number;
  shape: number;
  type: "pdf";
  range?: [number, number];
  points?: number;
}): DataFrame<{ x: number; density: number }>;
export function paretoData({
  scale,
  shape,
  type,
  range,
  points,
}: {
  scale: number;
  shape: number;
  type: "cdf";
  range?: [number, number];
  points?: number;
}): DataFrame<{ x: number; probability: number }>;
export function paretoData({
  scale,
  shape,
  type,
  range,
  points,
}: {
  scale: number;
  shape: number;
  type: "inverse_cdf";
  range?: [number, number];
  points?: number;
}): DataFrame<{ probability: number; quantile: number }>;
export function paretoData({
  scale,
  shape,
  type,
  range,
  points = 100,
}: {
  scale: number;
  shape: number;
  type: "pdf" | "cdf" | "inverse_cdf";
  range?: [number, number];
  points?: number;
}): any {
  const defaultRange: [number, number] = [
    scale,
    scale + 3 * (scale / (shape - 1)),
  ];

  if (type === "pdf") {
    return createDistributionData({
      distribution: {
        density: dpareto,
        probability: ppareto,
        quantile: qpareto,
      },
      params: { scale, shape },
      type: "pdf",
      config: { range: range ?? defaultRange, points },
    });
  } else if (type === "cdf") {
    return createDistributionData({
      distribution: {
        density: dpareto,
        probability: ppareto,
        quantile: qpareto,
      },
      params: { scale, shape },
      type: "cdf",
      config: { range: range ?? defaultRange, points },
    });
  } else {
    return createDistributionData({
      distribution: {
        density: dpareto,
        probability: ppareto,
        quantile: qpareto,
      },
      params: { scale, shape },
      type: "inverse_cdf",
      config: { range, points },
    });
  }
}
