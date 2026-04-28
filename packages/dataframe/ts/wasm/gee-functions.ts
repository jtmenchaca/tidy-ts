// GEE (geeglm) WASM wrapper

import { initWasm, wasmInternal } from "./wasm-init.ts";

export type GeeCorstr =
  | "independence"
  | "exchangeable"
  | "ar1"
  | "unstructured"
  | "userdefined"
  | "fixed";

export interface GeeglmFitOptions {
  epsilon?: number;
  maxIter?: number;
  trace?: boolean;
}

export interface GeeglmResult {
  coefficients: number[];
  residuals: number[];
  fittedValues: number[];
  clusterInfo: { nClusters: number; maxClusterSize: number };
  correlationStructure: string;
  stdErr: string;
  vcov?: number[][] | null;
}

function geeglmFit(
  formula: string,
  family: string,
  link: string,
  data: Record<string, number[]>,
  id: number[],
  waves: number[] | null,
  corstr: GeeCorstr,
  stdErr: "san.se" | "jack" | "j1s" | "fij" = "san.se",
  options?: GeeglmFitOptions,
): GeeglmResult {
  initWasm();
  const result = wasmInternal.geeglm_fit_wasm(
    formula,
    family,
    link,
    JSON.stringify(data),
    JSON.stringify(id),
    waves ? JSON.stringify(waves) : undefined,
    corstr,
    stdErr,
    options ? JSON.stringify(options) : undefined,
  ) as GeeglmResult;
  return result;
}
