// deno-lint-ignore-file no-explicit-any
// Native addon loader — builds a wasmInternal-compatible proxy from the napi .node addon

import { currentRuntime, Runtime } from "@tidy-ts/shims";
import process from "node:process";
import { createRequire } from "node:module";

// Name mapping: wasmInternal snake_case → napi camelCase
// TS calls wasmInternal.foo_wasm → strip _wasm → foo → fooNapi
// Rust napi fn: foo_napi → napi exports as: fooNapi
function snakeToNapiCamel(snake: string): string {
  const base = snake.replace(/_wasm$/, "");
  const camel = base.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
  return camel + "Napi";
}

// Functions that return JSON strings from napi (need JSON.parse)
const JSON_RESULT_FUNCTIONS = new Set([
  // Statistical tests
  "t_test_one_sample",
  "t_test_two_sample_independent",
  "t_test_paired",
  "z_test_one_sample",
  "z_test_two_sample",
  "anova_one_way",
  "welch_anova_wasm",
  "anova_two_way",
  "anova_two_way_factor_a_wasm",
  "anova_two_way_factor_b_wasm",
  "anova_two_way_interaction_wasm",
  "chi_square_independence",
  "chi_square_goodness_of_fit",
  "chi_square_variance",
  "mann_whitney_test",
  "mann_whitney_test_with_config",
  "wilcoxon_w_test",
  "shapiro_wilk_test",
  "anderson_darling_test",
  "dagostino_pearson_test",
  "fishers_exact_test_wasm",
  "kruskal_wallis_test_wasm",
  "pearson_correlation_test",
  "spearman_correlation_test",
  "kendall_correlation_test",
  "levene_test_wasm",
  "tukey_hsd_wasm",
  "games_howell_wasm",
  "dunn_test_wasm",
  "kolmogorov_smirnov_test_wasm",
  "kolmogorov_smirnov_uniform_wasm",
  "proportion_test_one_sample",
  "proportion_test_two_sample",
  // Sample size
  "t_sample_size",
  "z_sample_size",
  "chi_square_sample_size",
  "proportion_sample_size",
  // Survival
  "coxph_wasm",
  "survfit_km_wasm",
  "survdiff_wasm",
  "cox_residuals_wasm",
  "survsplit_wasm",
  "concordance_wasm",
  "survfit_cox_wasm",
  "coxph_counting_wasm",
  "cox_residuals_counting_wasm",
  "finegray_wasm",
  "cox_zph_wasm",
  // GLM
  "glm_fit_wasm",
  "glm_summary_wasm",
  "glm_rstandard_wasm",
  "glm_rstudent_wasm",
  "glm_influence_wasm",
  "glm_confint_wasm",
  "glm_predict_wasm",
  "glm_vcov_cl_wasm",
  // GEE
  "geeglm_fit_wasm",
  // GLMM
  "glmm_fit_wasm",
  // Target trial
  "target_trial_wasm",
  // Grouping
  "group_ids_codes_all",
]);

// Functions where the first arg is a JsValue object that napi expects as JSON string
const JSVALUE_INPUT_FUNCTIONS = new Set([
  "glm_summary_wasm",
  "glm_rstandard_wasm",
  "glm_rstudent_wasm",
  "glm_influence_wasm",
  "glm_confint_wasm",
  "glm_predict_wasm",
  "glm_vcov_cl_wasm",
]);

// Join functions that return {left, right} objects instead of JoinIdxU32 class
const JOIN_FUNCTIONS = new Set([
  "inner_join_typed_multi_u32",
  "left_join_typed_multi_u32",
  "right_join_typed_multi_u32",
  "outer_join_typed_multi_u32",
  "cross_join_u32",
]);

// Grouping function that returns Grouping-like object
const GROUPING_FUNCTIONS = new Set([
  "group_ids_codes_all",
]);



/**
 * Create a JoinIdxU32-compatible wrapper from napi's {left, right} Uint32Array object.
 * The WASM JoinIdxU32 has takeLeft()/takeRight() methods that return Uint32Array.
 */
function wrapJoinResult(result: { left: Uint32Array; right: Uint32Array }) {
  return {
    takeLeft: () => result.left,
    takeRight: () => result.right,
    free: () => {},
    [Symbol.dispose]: () => {},
  };
}

/**
 * Create a Grouping-compatible wrapper from napi's JSON string result.
 * The WASM Grouping has takeGidPerRow()/takeUniqueKeys() methods.
 */
function wrapGroupingResult(jsonStr: string) {
  const parsed = JSON.parse(jsonStr);
  return {
    takeGidPerRow: () => new Uint32Array(parsed.gid_per_row),
    takeUniqueKeys: () => new Uint32Array(parsed.unique_keys),
    n_groups: parsed.n_groups,
    n_key_cols: parsed.n_key_cols,
    free: () => {},
    [Symbol.dispose]: () => {},
  };
}

/**
 * Try to load the native .node addon. Returns null if not available.
 *
 * Resolution order:
 * 1. npm platform package via createRequire: @tidy-ts/dataframe-{platform}-{arch}
 * 2. npm: specifier via dynamic import (for Deno JSR consumers)
 */
export async function tryLoadNative(): Promise<Record<string, any> | null> {
  if (currentRuntime === Runtime.Browser) {
    return null;
  }

  // Allow disabling native addon via env var (e.g. for benchmarking WASM)
  if (process.env.TIDY_TS_NATIVE === "0") {
    return null;
  }

  const suffix = `${process.platform}-${process.arch}`;
  const req = createRequire(import.meta.url);

  // Try npm platform package (installed via optionalDependencies)
  try {
    return req(`@tidy-ts/dataframe-${suffix}`);
  } catch {
    // Not installed via npm — fall through
  }

  // Try npm: specifier (Deno JSR consumers)
  try {
    const mod = await import(`npm:@tidy-ts/dataframe-${suffix}`);
    return mod.default ?? mod;
  } catch {
    return null;
  }
}

/**
 * Build a wasmInternal-compatible proxy from the native addon.
 * Maps snake_case WASM names to camelCase napi names,
 * converts TypedArray args, and parses JSON results.
 */
export function buildNativeProxy(native: Record<string, any>): Record<string, any> {
  const proxy: Record<string, any> = {};

  // Build reverse map: for each napi export, figure out the wasm name
  const napiNames = new Set(Object.keys(native));

  return new Proxy(proxy, {
    get(_target, prop: string) {
      // Internal wasm-bindgen functions — no-op for native
      if (prop === "__wbg_set_wasm" || prop === "__wbindgen_start" ||
          prop === "__externref_table_alloc" || prop === "__wbindgen_externrefs") {
        return () => {};
      }

      const napiName = snakeToNapiCamel(prop);

      if (!napiNames.has(napiName)) {
        return undefined;
      }

      const nativeFn = native[napiName];
      const isJsonResult = JSON_RESULT_FUNCTIONS.has(prop);
      const isJsValueInput = JSVALUE_INPUT_FUNCTIONS.has(prop);
      const isJoin = JOIN_FUNCTIONS.has(prop);
      const isGrouping = GROUPING_FUNCTIONS.has(prop);

      return (...args: any[]) => {
        // Convert TypedArrays that napi expects as Vec<T> (plain JS arrays).
        // napi accepts &[f64]/&[u32] from TypedArrays (buffer binding), but
        // Vec<i8> etc. require a plain JS array.
        let convertedArgs = args.map((arg: any) => {
          if (arg instanceof Int8Array || arg instanceof Int16Array || arg instanceof Int32Array) {
            return Array.from(arg);
          }
          return arg;
        });

        // For JsValue input functions, stringify all object/array args
        // (Rust napi expects String where wasm_bindgen used JsValue)
        if (isJsValueInput) {
          convertedArgs = convertedArgs.map((arg: any) => {
            if (typeof arg === "object" && arg !== null) {
              return JSON.stringify(arg);
            }
            return arg;
          });
        }

        const result = nativeFn(...convertedArgs);

        // Join functions: wrap {left, right} as JoinIdxU32-like object
        if (isJoin) {
          return wrapJoinResult(result);
        }

        // Grouping: parse JSON and wrap as Grouping-like object
        if (isGrouping) {
          return wrapGroupingResult(result);
        }

        // JSON result functions: parse the string
        if (isJsonResult && typeof result === "string") {
          return JSON.parse(result);
        }

        // For functions returning Vec<f64>/Vec<u32>, napi returns plain arrays.
        // The WASM equivalents return TypedArrays. Convert back.
        if (Array.isArray(result) && result.length > 0 && typeof result[0] === "number") {
          // Determine if it should be Uint32Array or Float64Array
          // For now, return plain arrays — the TS wrappers handle both
          return result;
        }

        return result;
      };
    },
    has(_target, prop: string) {
      if (typeof prop !== "string") return false;
      const napiName = snakeToNapiCamel(prop);
      return napiNames.has(napiName);
    },
  });
}
