// Stats functions module
// deno-lint-ignore-file no-explicit-any

import * as wasmInternal from "../../lib/tidy_ts_dataframe.internal.js";
import { initWasm } from "./wasm-init.ts";

// Stats functions
export function unique_f64(values: any) {
  initWasm();
  return wasmInternal.unique_f64(values);
}

export function unique_i32(values: any) {
  initWasm();
  return wasmInternal.unique_i32(values);
}

export function unique_str(values: any) {
  initWasm();
  return wasmInternal.unique_str(values);
}

export function count_f64(values: any, target: any) {
  initWasm();
  return wasmInternal.count_f64(values, target);
}

export function count_i32(values: any, target: any) {
  initWasm();
  return wasmInternal.count_i32(values, target);
}

export function count_str(values: any, target: any) {
  initWasm();
  return wasmInternal.count_str(values, target);
}

export function sum_wasm(values: any) {
  initWasm();
  return wasmInternal.sum_wasm(values);
}

export function quantile_wasm(values: any, probs: any) {
  initWasm();
  return wasmInternal.quantile_wasm(values, probs);
}

export function median_wasm(values: any) {
  initWasm();
  return wasmInternal.median_wasm(values);
}

export function iqr_wasm(values: any) {
  initWasm();
  return wasmInternal.iqr_wasm(values);
}

// Distinct functions
export function distinct_rows_generic_typed(
  column_data: Uint32Array[],
  view_index: Uint32Array,
) {
  initWasm();
  return wasmInternal.distinct_rows_generic_typed(column_data, view_index);
}

// ============== GEE (geeglm) WASM wrapper ==============
export type GeeCorstr =
  | "independence"
  | "exchangeable"
  | "ar1"
  | "unstructured"
  | "userdefined"
  | "fixed";

export interface GeeglmFitOptions {
  epsilon?: number;
  max_iter?: number;
  trace?: boolean;
}

export interface GeeglmResult {
  coefficients: number[];
  residuals: number[];
  fitted_values: number[];
  cluster_info: { n_clusters: number; max_cluster_size: number };
  correlation_structure: string;
  std_err: string;
  vcov?: number[][] | null;
}

export function geeglmFit(
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
  const resJson = wasmInternal.geeglm_fit_wasm(
    formula,
    family,
    link,
    JSON.stringify(data),
    JSON.stringify(id),
    waves ? JSON.stringify(waves) : undefined,
    corstr,
    stdErr,
    options ? JSON.stringify(options) : undefined,
  );
  const res = JSON.parse(resJson);
  if (res.error) throw new Error(res.error);
  return res as GeeglmResult;
}
