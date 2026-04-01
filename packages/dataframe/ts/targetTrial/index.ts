/**
 * Target Trial Emulation — TypeScript thin wrapper.
 *
 * Single WASM call: serialize config + data → Rust pipeline → deserialize result.
 */

import { initWasm, wasmInternal } from "../wasm/wasm-init.ts";
import type {
  ColumnarData,
  TargetTrialConfig,
  TargetTrialResult,
} from "./types.ts";

export type {
  AnalysisMethod,
  BootstrapConfig,
  CIMethod,
  ColumnarData,
  DeviationConfig,
  HazardRatioResult,
  RiskComparison,
  SurvivalPoint,
  TargetTrialConfig,
  TargetTrialResult,
  WeightConfig,
  WeightDiagnostics,
} from "./types.ts";

/**
 * Run target trial emulation.
 *
 * The entire pipeline runs in Rust/WASM:
 * expand → weights → outcome model → survival curves → hazard ratios → bootstrap → CIs
 *
 * @param config - Full pipeline configuration (column names, analysis method, formulas, bootstrap params, etc.)
 * @param data - Columnar data (numeric + categorical columns)
 * @returns Full result including survival curves, hazard ratios, risk comparisons, and diagnostics
 */
export function targetTrialEmulation({
  config,
  data,
}: {
  config: TargetTrialConfig;
  data: ColumnarData;
}): TargetTrialResult {
  initWasm();

  const configJson = JSON.stringify(config, (_key, value) =>
    value === Infinity ? 1e308 : value === -Infinity ? -1e308 : value,
  );
  const dataJson = JSON.stringify(data);

  const raw = wasmInternal.target_trial_wasm(
    configJson,
    dataJson,
  ) as TargetTrialResult;

  // serde_wasm_bindgen serializes HashMap as JS Map; convert to plain object
  if (raw.survival instanceof Map) {
    const obj: Record<string, typeof raw.survival[string]> = {};
    for (const [k, v] of raw.survival as unknown as Map<string, typeof raw.survival[string]>) {
      obj[k] = v;
    }
    raw.survival = obj;
  }

  return raw;
}
