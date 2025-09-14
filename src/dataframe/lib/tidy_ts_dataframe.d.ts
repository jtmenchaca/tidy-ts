// @generated file from wasmbuild -- do not edit
// deno-lint-ignore-file
// deno-fmt-ignore-file

/**
 * Sum aggregation for f64 values
 */
export function reduce_sum_f64(
  gid_per_row: Uint32Array,
  vals: Float64Array,
  n_groups: number,
): Float64Array;
/**
 * Count aggregation (number of non-null values)
 */
export function reduce_count_u32(
  gid_per_row: Uint32Array,
  valid: Uint8Array,
  n_groups: number,
): Uint32Array;
/**
 * Mean aggregation for f64 values
 */
export function reduce_mean_f64(
  gid_per_row: Uint32Array,
  vals: Float64Array,
  valid: Uint8Array,
  n_groups: number,
): Float64Array;
/**
 * WASM export: fill `indices` with sorted order (u32).
 * - `flat_cols`: column-major f64 matrix [n_cols * n_rows]
 * - `dirs`: i8 (+1 = asc, -1 = desc), length = n_cols
 */
export function arrange_multi_f64_wasm(
  flat_cols: Float64Array,
  n_rows: number,
  n_cols: number,
  dirs: Int8Array,
  indices: Uint32Array,
): void;
/**
 * Stable sort `indices` by one f64 key vector (NaN last), asc/desc.
 */
export function stable_sort_indices_f64_wasm(
  values: Float64Array,
  indices: Uint32Array,
  ascending: boolean,
): void;
/**
 * Stable sort `indices` by one u32 rank key vector, asc/desc, with explicit NA code (last).
 */
export function stable_sort_indices_u32_wasm(
  ranks: Uint32Array,
  indices: Uint32Array,
  ascending: boolean,
  na_code: number,
): void;
export function count_f64(values: Float64Array, target: number): number;
export function count_i32(values: Int32Array, target: number): number;
export function count_str(values: string[], target: string): number;
/**
 * Cross join (Cartesian product) - returns u32 indices
 */
export function cross_join_u32(left_len: number, right_len: number): JoinIdxU32;
/**
 * Ultra-optimized distinct using direct typed arrays - exactly like test_ultra_optimized_distinct.rs
 */
export function distinct_rows_generic_typed(
  column_data: Uint32Array[],
  view_index: Uint32Array,
): Uint32Array;
/**
 * WASM export for batch numeric filtering
 *
 * Compares a numeric array against a threshold value with the given operation.
 * Operations: 0=GT, 1=GTE, 2=LT, 3=LTE, 4=EQ, 5=NE
 */
export function batch_filter_numbers(
  values: Float64Array,
  threshold: number,
  operation: number,
  output: Uint8Array,
): void;
/**
 * Perform grouping in a single pass, returning all necessary data
 */
export function group_ids_codes_all(
  keys_codes: Uint32Array,
  n_rows: number,
  n_key_cols: number,
): Grouping;
export function group_ids_codes(
  keys_codes: Uint32Array,
  n_rows: number,
  n_key_cols: number,
): Uint32Array;
/**
 * Get unique group keys from grouping operation
 *
 * This function needs to be called after group_ids_codes to get the unique keys.
 * The keys are stored in row-major order (group then columns).
 */
export function get_unique_group_keys(
  keys_codes: Uint32Array,
  n_rows: number,
  n_key_cols: number,
): Uint32Array;
/**
 * Get number of groups from grouping operation
 */
export function get_group_count(
  keys_codes: Uint32Array,
  n_rows: number,
  n_key_cols: number,
): number;
/**
 * Get group information for a specific group
 *
 * Args:
 * - unique_keys: Unique group keys from group_ids_codes
 * - n_key_cols: Number of key columns
 * - group_id: Group ID to get information for
 *
 * Returns:
 * - key_values: The group's key values
 */
export function get_group_info(
  unique_keys: Uint32Array,
  n_key_cols: number,
  group_id: number,
): Uint32Array;
/**
 * Ultra-optimized inner join using shared utilities and specialized kernels
 */
export function inner_join_typed_multi_u32(
  left_columns: Uint32Array[],
  right_columns: Uint32Array[],
): JoinIdxU32;
/**
 * WASM export for interquartile range
 */
export function iqr_wasm(data: Float64Array): number;
export function left_join_typed_multi_u32(
  left_columns: Uint32Array[],
  right_columns: Uint32Array[],
): JoinIdxU32;
/**
 * WASM export for median calculation
 */
export function median_wasm(data: Float64Array): number;
/**
 * Ultra-optimized outer join using shared utilities and specialized kernels
 */
export function outer_join_typed_multi_u32(
  left_columns: Uint32Array[],
  right_columns: Uint32Array[],
): JoinIdxU32;
/**
 * Ultra-optimized pivot_longer using typed arrays and bulk copying
 */
export function pivot_longer_typed_arrays(
  keep_cols_data: Uint32Array,
  fold_cols_data: Float64Array,
  fold_cols_names: Uint32Array,
  n_input_rows: number,
  n_keep_cols: number,
  n_fold_cols: number,
): PivotLongerResult;
/**
 * Ultra-optimized pivot_longer for numeric data with validation
 */
export function pivot_longer_typed_numeric(
  keep_cols_data: Uint32Array,
  fold_cols_data: Float64Array,
  fold_cols_valid: Uint8Array,
  fold_cols_names: Uint32Array,
  n_input_rows: number,
  n_keep_cols: number,
  n_fold_cols: number,
): PivotLongerResult;
/**
 * Ultra-optimized pivot_longer for string data
 */
export function pivot_longer_typed_strings(
  keep_cols_data: Uint32Array,
  fold_cols_data: Uint32Array,
  fold_cols_names: Uint32Array,
  n_input_rows: number,
  n_keep_cols: number,
  n_fold_cols: number,
): PivotLongerStringResult;
/**
 * Perform pivot_longer operation on dictionary-encoded columns
 *
 * Args:
 * - keep_cols_data: Column-major dictionary-encoded data for columns to keep (n_keep_cols × n_input_rows)
 * - fold_cols_data: Column-major data for columns to fold/melt (n_fold_cols × n_input_rows)
 * - fold_cols_names: Dictionary codes for the names of columns being folded
 * - n_input_rows: Number of input rows
 * - n_keep_cols: Number of columns to keep
 * - n_fold_cols: Number of columns to fold/melt
 */
export function pivot_longer_dense(
  keep_cols_data: Uint32Array,
  fold_cols_data: Float64Array,
  fold_cols_names: Uint32Array,
  n_input_rows: number,
  n_keep_cols: number,
  n_fold_cols: number,
): PivotLongerResult;
/**
 * Optimized pivot_longer for the common case of numeric values
 * This version handles NaN/undefined values appropriately
 */
export function pivot_longer_numeric(
  keep_cols_data: Uint32Array,
  fold_cols_data: Float64Array,
  fold_cols_valid: Uint8Array,
  fold_cols_names: Uint32Array,
  n_input_rows: number,
  n_keep_cols: number,
  n_fold_cols: number,
): PivotLongerResult;
/**
 * Fast pivot_longer specifically for string columns
 * Returns dictionary codes that can be decoded in TypeScript
 */
export function pivot_longer_strings(
  keep_cols_data: Uint32Array,
  fold_cols_data: Uint32Array,
  fold_cols_names: Uint32Array,
  n_input_rows: number,
  n_keep_cols: number,
  n_fold_cols: number,
): PivotLongerStringResult;
/**
 * policy: 0=first, 1=last, 2=sum, 3=mean
 */
export function pivot_wider_dense_f64(
  gid_per_row: Uint32Array,
  cat_codes: Uint32Array,
  values: Float64Array,
  n_groups: number,
  n_cats: number,
  policy: number,
): Float64Array;
/**
 * Get seen flags from dense pivot operation
 *
 * This function needs to be called after pivot_wider_dense_f64 to get
 * the seen flags indicating which cells have values.
 */
export function pivot_wider_seen_flags(
  gid_per_row: Uint32Array,
  cat_codes: Uint32Array,
  _values: Float64Array,
  n_groups: number,
  n_cats: number,
  _policy: number,
): Uint8Array;
/**
 * Combined pivot operation that returns values and seen flags in one pass
 * policy: 0=first, 1=last, 2=sum, 3=mean
 */
export function pivot_wider_dense_f64_all(
  gid_per_row: Uint32Array,
  cat_codes: Uint32Array,
  values: Float64Array,
  n_groups: number,
  n_cats: number,
  policy: number,
): PivotDenseF64;
/**
 * WASM export for general quantile calculation
 * Uses R's Type 7 algorithm (default)
 */
export function quantile_wasm(
  data: Float64Array,
  probs: Float64Array,
): Float64Array;
/**
 * Ultra-optimized right join using shared utilities and specialized kernels
 */
export function right_join_typed_multi_u32(
  left_columns: Uint32Array[],
  right_columns: Uint32Array[],
): JoinIdxU32;
/**
 * WASM export for sum calculation
 */
export function sum_wasm(values: Float64Array): number;
/**
 * WASM export for unique f64 values
 */
export function unique_f64(values: Float64Array): Float64Array;
/**
 * WASM export for unique i32 values
 */
export function unique_i32(values: Int32Array): Int32Array;
/**
 * WASM export for unique string values
 */
export function unique_str(values: string[]): string[];
export function wasm_test(): number;
/**
 * Grouping result that contains all information in one pass
 */
export class Grouping {
  private constructor();
  free(): void;
  takeGidPerRow(): Uint32Array;
  takeUniqueKeys(): Uint32Array;
  n_groups: number;
  n_key_cols: number;
}
/**
 * Optimized WASM join result using packed u32 arrays with sentinel values
 */
export class JoinIdxU32 {
  private constructor();
  free(): void;
  /**
   * Move out the left indices (no clone)
   */
  takeLeft(): Uint32Array;
  /**
   * Move out the right indices (no clone)
   */
  takeRight(): Uint32Array;
}
/**
 * Combined pivot result with values and seen flags
 */
export class PivotDenseF64 {
  private constructor();
  free(): void;
  takeValues(): Float64Array;
  takeSeen(): Uint8Array;
  n_groups: number;
  n_cats: number;
}
/**
 * Result of pivot_longer operation containing reshaped data
 */
export class PivotLongerResult {
  private constructor();
  free(): void;
  takeKeepData(): Uint32Array;
  takeNamesData(): Uint32Array;
  takeValuesData(): Float64Array;
  n_rows: number;
  n_keep_cols: number;
}
/**
 * Result for string pivot_longer operations
 */
export class PivotLongerStringResult {
  private constructor();
  free(): void;
  takeKeepData(): Uint32Array;
  takeNamesData(): Uint32Array;
  takeValuesData(): Uint32Array;
  n_rows: number;
  n_keep_cols: number;
}
