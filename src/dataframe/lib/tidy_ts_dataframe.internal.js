// @generated file from wasmbuild -- do not edit
// @ts-nocheck: generated
// deno-lint-ignore-file
// deno-fmt-ignore-file

let wasm;
export function __wbg_set_wasm(val) {
  wasm = val;
}

let cachedUint8ArrayMemory0 = null;

function getUint8ArrayMemory0() {
  if (
    cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0
  ) {
    cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
  }
  return cachedUint8ArrayMemory0;
}

function getArrayU8FromWasm0(ptr, len) {
  ptr = ptr >>> 0;
  return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let WASM_VECTOR_LEN = 0;

const lTextEncoder = typeof TextEncoder === "undefined"
  ? (0, module.require)("util").TextEncoder
  : TextEncoder;

let cachedTextEncoder = new lTextEncoder("utf-8");

const encodeString = typeof cachedTextEncoder.encodeInto === "function"
  ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
  }
  : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
      read: arg.length,
      written: buf.length,
    };
  };

function passStringToWasm0(arg, malloc, realloc) {
  if (realloc === undefined) {
    const buf = cachedTextEncoder.encode(arg);
    const ptr = malloc(buf.length, 1) >>> 0;
    getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
    WASM_VECTOR_LEN = buf.length;
    return ptr;
  }

  let len = arg.length;
  let ptr = malloc(len, 1) >>> 0;

  const mem = getUint8ArrayMemory0();

  let offset = 0;

  for (; offset < len; offset++) {
    const code = arg.charCodeAt(offset);
    if (code > 0x7F) break;
    mem[ptr + offset] = code;
  }

  if (offset !== len) {
    if (offset !== 0) {
      arg = arg.slice(offset);
    }
    ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
    const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
    const ret = encodeString(arg, view);

    offset += ret.written;
    ptr = realloc(ptr, len, offset, 1) >>> 0;
  }

  WASM_VECTOR_LEN = offset;
  return ptr;
}

function isLikeNone(x) {
  return x === undefined || x === null;
}

let cachedDataViewMemory0 = null;

function getDataViewMemory0() {
  if (
    cachedDataViewMemory0 === null ||
    cachedDataViewMemory0.buffer.detached === true ||
    (cachedDataViewMemory0.buffer.detached === undefined &&
      cachedDataViewMemory0.buffer !== wasm.memory.buffer)
  ) {
    cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
  }
  return cachedDataViewMemory0;
}

const lTextDecoder = typeof TextDecoder === "undefined"
  ? (0, module.require)("util").TextDecoder
  : TextDecoder;

let cachedTextDecoder = new lTextDecoder("utf-8", {
  ignoreBOM: true,
  fatal: true,
});

cachedTextDecoder.decode();

function getStringFromWasm0(ptr, len) {
  ptr = ptr >>> 0;
  return cachedTextDecoder.decode(
    getUint8ArrayMemory0().subarray(ptr, ptr + len),
  );
}

let cachedUint32ArrayMemory0 = null;

function getUint32ArrayMemory0() {
  if (
    cachedUint32ArrayMemory0 === null ||
    cachedUint32ArrayMemory0.byteLength === 0
  ) {
    cachedUint32ArrayMemory0 = new Uint32Array(wasm.memory.buffer);
  }
  return cachedUint32ArrayMemory0;
}

function getArrayU32FromWasm0(ptr, len) {
  ptr = ptr >>> 0;
  return getUint32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}

function passArray32ToWasm0(arg, malloc) {
  const ptr = malloc(arg.length * 4, 4) >>> 0;
  getUint32ArrayMemory0().set(arg, ptr / 4);
  WASM_VECTOR_LEN = arg.length;
  return ptr;
}

let cachedFloat64ArrayMemory0 = null;

function getFloat64ArrayMemory0() {
  if (
    cachedFloat64ArrayMemory0 === null ||
    cachedFloat64ArrayMemory0.byteLength === 0
  ) {
    cachedFloat64ArrayMemory0 = new Float64Array(wasm.memory.buffer);
  }
  return cachedFloat64ArrayMemory0;
}

function passArrayF64ToWasm0(arg, malloc) {
  const ptr = malloc(arg.length * 8, 8) >>> 0;
  getFloat64ArrayMemory0().set(arg, ptr / 8);
  WASM_VECTOR_LEN = arg.length;
  return ptr;
}

function getArrayF64FromWasm0(ptr, len) {
  ptr = ptr >>> 0;
  return getFloat64ArrayMemory0().subarray(ptr / 8, ptr / 8 + len);
}
/**
 * Sum aggregation for f64 values
 * @param {Uint32Array} gid_per_row
 * @param {Float64Array} vals
 * @param {number} n_groups
 * @returns {Float64Array}
 */
export function reduce_sum_f64(gid_per_row, vals, n_groups) {
  const ptr0 = passArray32ToWasm0(gid_per_row, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passArrayF64ToWasm0(vals, wasm.__wbindgen_malloc);
  const len1 = WASM_VECTOR_LEN;
  const ret = wasm.reduce_sum_f64(ptr0, len0, ptr1, len1, n_groups);
  var v3 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
  wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
  return v3;
}

function passArray8ToWasm0(arg, malloc) {
  const ptr = malloc(arg.length * 1, 1) >>> 0;
  getUint8ArrayMemory0().set(arg, ptr / 1);
  WASM_VECTOR_LEN = arg.length;
  return ptr;
}
/**
 * Count aggregation (number of non-null values)
 * @param {Uint32Array} gid_per_row
 * @param {Uint8Array} valid
 * @param {number} n_groups
 * @returns {Uint32Array}
 */
export function reduce_count_u32(gid_per_row, valid, n_groups) {
  const ptr0 = passArray32ToWasm0(gid_per_row, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passArray8ToWasm0(valid, wasm.__wbindgen_malloc);
  const len1 = WASM_VECTOR_LEN;
  const ret = wasm.reduce_count_u32(ptr0, len0, ptr1, len1, n_groups);
  var v3 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
  wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
  return v3;
}

/**
 * Mean aggregation for f64 values
 * @param {Uint32Array} gid_per_row
 * @param {Float64Array} vals
 * @param {Uint8Array} valid
 * @param {number} n_groups
 * @returns {Float64Array}
 */
export function reduce_mean_f64(gid_per_row, vals, valid, n_groups) {
  const ptr0 = passArray32ToWasm0(gid_per_row, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passArrayF64ToWasm0(vals, wasm.__wbindgen_malloc);
  const len1 = WASM_VECTOR_LEN;
  const ptr2 = passArray8ToWasm0(valid, wasm.__wbindgen_malloc);
  const len2 = WASM_VECTOR_LEN;
  const ret = wasm.reduce_mean_f64(
    ptr0,
    len0,
    ptr1,
    len1,
    ptr2,
    len2,
    n_groups,
  );
  var v4 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
  wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
  return v4;
}

function takeFromExternrefTable0(idx) {
  const value = wasm.__wbindgen_export_0.get(idx);
  wasm.__externref_table_dealloc(idx);
  return value;
}
/**
 * WASM export: fill `indices` with sorted order (u32).
 * - `flat_cols`: column-major f64 matrix [n_cols * n_rows]
 * - `dirs`: i8 (+1 = asc, -1 = desc), length = n_cols
 * @param {Float64Array} flat_cols
 * @param {number} n_rows
 * @param {number} n_cols
 * @param {Int8Array} dirs
 * @param {Uint32Array} indices
 */
export function arrange_multi_f64_wasm(
  flat_cols,
  n_rows,
  n_cols,
  dirs,
  indices,
) {
  const ptr0 = passArrayF64ToWasm0(flat_cols, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passArray8ToWasm0(dirs, wasm.__wbindgen_malloc);
  const len1 = WASM_VECTOR_LEN;
  var ptr2 = passArray32ToWasm0(indices, wasm.__wbindgen_malloc);
  var len2 = WASM_VECTOR_LEN;
  const ret = wasm.arrange_multi_f64_wasm(
    ptr0,
    len0,
    n_rows,
    n_cols,
    ptr1,
    len1,
    ptr2,
    len2,
    indices,
  );
  if (ret[1]) {
    throw takeFromExternrefTable0(ret[0]);
  }
}

/**
 * Stable sort `indices` by one f64 key vector (NaN last), asc/desc.
 * @param {Float64Array} values
 * @param {Uint32Array} indices
 * @param {boolean} ascending
 */
export function stable_sort_indices_f64_wasm(values, indices, ascending) {
  const ptr0 = passArrayF64ToWasm0(values, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  var ptr1 = passArray32ToWasm0(indices, wasm.__wbindgen_malloc);
  var len1 = WASM_VECTOR_LEN;
  const ret = wasm.stable_sort_indices_f64_wasm(
    ptr0,
    len0,
    ptr1,
    len1,
    indices,
    ascending,
  );
  if (ret[1]) {
    throw takeFromExternrefTable0(ret[0]);
  }
}

/**
 * Stable sort `indices` by one u32 rank key vector, asc/desc, with explicit NA code (last).
 * @param {Uint32Array} ranks
 * @param {Uint32Array} indices
 * @param {boolean} ascending
 * @param {number} na_code
 */
export function stable_sort_indices_u32_wasm(
  ranks,
  indices,
  ascending,
  na_code,
) {
  const ptr0 = passArray32ToWasm0(ranks, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  var ptr1 = passArray32ToWasm0(indices, wasm.__wbindgen_malloc);
  var len1 = WASM_VECTOR_LEN;
  const ret = wasm.stable_sort_indices_u32_wasm(
    ptr0,
    len0,
    ptr1,
    len1,
    indices,
    ascending,
    na_code,
  );
  if (ret[1]) {
    throw takeFromExternrefTable0(ret[0]);
  }
}

/**
 * @param {Float64Array} values
 * @param {number} target
 * @returns {number}
 */
export function count_f64(values, target) {
  const ptr0 = passArrayF64ToWasm0(values, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ret = wasm.count_f64(ptr0, len0, target);
  return ret >>> 0;
}

/**
 * @param {Int32Array} values
 * @param {number} target
 * @returns {number}
 */
export function count_i32(values, target) {
  const ptr0 = passArray32ToWasm0(values, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ret = wasm.count_i32(ptr0, len0, target);
  return ret >>> 0;
}

function addToExternrefTable0(obj) {
  const idx = wasm.__externref_table_alloc();
  wasm.__wbindgen_export_0.set(idx, obj);
  return idx;
}

function passArrayJsValueToWasm0(array, malloc) {
  const ptr = malloc(array.length * 4, 4) >>> 0;
  for (let i = 0; i < array.length; i++) {
    const add = addToExternrefTable0(array[i]);
    getDataViewMemory0().setUint32(ptr + 4 * i, add, true);
  }
  WASM_VECTOR_LEN = array.length;
  return ptr;
}
/**
 * @param {string[]} values
 * @param {string} target
 * @returns {number}
 */
export function count_str(values, target) {
  const ptr0 = passArrayJsValueToWasm0(values, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passStringToWasm0(
    target,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len1 = WASM_VECTOR_LEN;
  const ret = wasm.count_str(ptr0, len0, ptr1, len1);
  return ret >>> 0;
}

/**
 * Cross join (Cartesian product) - returns u32 indices
 * @param {number} left_len
 * @param {number} right_len
 * @returns {JoinIdxU32}
 */
export function cross_join_u32(left_len, right_len) {
  const ret = wasm.cross_join_u32(left_len, right_len);
  return JoinIdxU32.__wrap(ret);
}

/**
 * Ultra-optimized distinct using direct typed arrays - exactly like test_ultra_optimized_distinct.rs
 * @param {Uint32Array[]} column_data
 * @param {Uint32Array} view_index
 * @returns {Uint32Array}
 */
export function distinct_rows_generic_typed(column_data, view_index) {
  const ptr0 = passArrayJsValueToWasm0(column_data, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passArray32ToWasm0(view_index, wasm.__wbindgen_malloc);
  const len1 = WASM_VECTOR_LEN;
  const ret = wasm.distinct_rows_generic_typed(ptr0, len0, ptr1, len1);
  var v3 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
  wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
  return v3;
}

/**
 * WASM export for batch numeric filtering
 *
 * Compares a numeric array against a threshold value with the given operation.
 * Operations: 0=GT, 1=GTE, 2=LT, 3=LTE, 4=EQ, 5=NE
 * @param {Float64Array} values
 * @param {number} threshold
 * @param {number} operation
 * @param {Uint8Array} output
 */
export function batch_filter_numbers(values, threshold, operation, output) {
  const ptr0 = passArrayF64ToWasm0(values, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  var ptr1 = passArray8ToWasm0(output, wasm.__wbindgen_malloc);
  var len1 = WASM_VECTOR_LEN;
  const ret = wasm.batch_filter_numbers(
    ptr0,
    len0,
    threshold,
    operation,
    ptr1,
    len1,
    output,
  );
  if (ret[1]) {
    throw takeFromExternrefTable0(ret[0]);
  }
}

/**
 * Perform grouping in a single pass, returning all necessary data
 * @param {Uint32Array} keys_codes
 * @param {number} n_rows
 * @param {number} n_key_cols
 * @returns {Grouping}
 */
export function group_ids_codes_all(keys_codes, n_rows, n_key_cols) {
  const ptr0 = passArray32ToWasm0(keys_codes, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ret = wasm.group_ids_codes_all(ptr0, len0, n_rows, n_key_cols);
  return Grouping.__wrap(ret);
}

/**
 * @param {Uint32Array} keys_codes
 * @param {number} n_rows
 * @param {number} n_key_cols
 * @returns {Uint32Array}
 */
export function group_ids_codes(keys_codes, n_rows, n_key_cols) {
  const ptr0 = passArray32ToWasm0(keys_codes, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ret = wasm.group_ids_codes(ptr0, len0, n_rows, n_key_cols);
  var v2 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
  wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
  return v2;
}

/**
 * Get unique group keys from grouping operation
 *
 * This function needs to be called after group_ids_codes to get the unique keys.
 * The keys are stored in row-major order (group then columns).
 * @param {Uint32Array} keys_codes
 * @param {number} n_rows
 * @param {number} n_key_cols
 * @returns {Uint32Array}
 */
export function get_unique_group_keys(keys_codes, n_rows, n_key_cols) {
  const ptr0 = passArray32ToWasm0(keys_codes, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ret = wasm.get_unique_group_keys(ptr0, len0, n_rows, n_key_cols);
  var v2 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
  wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
  return v2;
}

/**
 * Get number of groups from grouping operation
 * @param {Uint32Array} keys_codes
 * @param {number} n_rows
 * @param {number} n_key_cols
 * @returns {number}
 */
export function get_group_count(keys_codes, n_rows, n_key_cols) {
  const ptr0 = passArray32ToWasm0(keys_codes, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ret = wasm.get_group_count(ptr0, len0, n_rows, n_key_cols);
  return ret >>> 0;
}

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
 * @param {Uint32Array} unique_keys
 * @param {number} n_key_cols
 * @param {number} group_id
 * @returns {Uint32Array}
 */
export function get_group_info(unique_keys, n_key_cols, group_id) {
  const ptr0 = passArray32ToWasm0(unique_keys, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ret = wasm.get_group_info(ptr0, len0, n_key_cols, group_id);
  var v2 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
  wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
  return v2;
}

/**
 * Ultra-optimized inner join using shared utilities and specialized kernels
 * @param {Uint32Array[]} left_columns
 * @param {Uint32Array[]} right_columns
 * @returns {JoinIdxU32}
 */
export function inner_join_typed_multi_u32(left_columns, right_columns) {
  const ptr0 = passArrayJsValueToWasm0(left_columns, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passArrayJsValueToWasm0(right_columns, wasm.__wbindgen_malloc);
  const len1 = WASM_VECTOR_LEN;
  const ret = wasm.inner_join_typed_multi_u32(ptr0, len0, ptr1, len1);
  return JoinIdxU32.__wrap(ret);
}

/**
 * WASM export for interquartile range
 * @param {Float64Array} data
 * @returns {number}
 */
export function iqr_wasm(data) {
  const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ret = wasm.iqr_wasm(ptr0, len0);
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return ret[0];
}

/**
 * @param {Uint32Array[]} left_columns
 * @param {Uint32Array[]} right_columns
 * @returns {JoinIdxU32}
 */
export function left_join_typed_multi_u32(left_columns, right_columns) {
  const ptr0 = passArrayJsValueToWasm0(left_columns, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passArrayJsValueToWasm0(right_columns, wasm.__wbindgen_malloc);
  const len1 = WASM_VECTOR_LEN;
  const ret = wasm.left_join_typed_multi_u32(ptr0, len0, ptr1, len1);
  return JoinIdxU32.__wrap(ret);
}

/**
 * WASM export for median calculation
 * @param {Float64Array} data
 * @returns {number}
 */
export function median_wasm(data) {
  const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ret = wasm.median_wasm(ptr0, len0);
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return ret[0];
}

/**
 * Ultra-optimized outer join using shared utilities and specialized kernels
 * @param {Uint32Array[]} left_columns
 * @param {Uint32Array[]} right_columns
 * @returns {JoinIdxU32}
 */
export function outer_join_typed_multi_u32(left_columns, right_columns) {
  const ptr0 = passArrayJsValueToWasm0(left_columns, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passArrayJsValueToWasm0(right_columns, wasm.__wbindgen_malloc);
  const len1 = WASM_VECTOR_LEN;
  const ret = wasm.outer_join_typed_multi_u32(ptr0, len0, ptr1, len1);
  return JoinIdxU32.__wrap(ret);
}

/**
 * Ultra-optimized pivot_longer using typed arrays and bulk copying
 * @param {Uint32Array} keep_cols_data
 * @param {Float64Array} fold_cols_data
 * @param {Uint32Array} fold_cols_names
 * @param {number} n_input_rows
 * @param {number} n_keep_cols
 * @param {number} n_fold_cols
 * @returns {PivotLongerResult}
 */
export function pivot_longer_typed_arrays(
  keep_cols_data,
  fold_cols_data,
  fold_cols_names,
  n_input_rows,
  n_keep_cols,
  n_fold_cols,
) {
  const ret = wasm.pivot_longer_typed_arrays(
    keep_cols_data,
    fold_cols_data,
    fold_cols_names,
    n_input_rows,
    n_keep_cols,
    n_fold_cols,
  );
  return PivotLongerResult.__wrap(ret);
}

/**
 * Ultra-optimized pivot_longer for numeric data with validation
 * @param {Uint32Array} keep_cols_data
 * @param {Float64Array} fold_cols_data
 * @param {Uint8Array} fold_cols_valid
 * @param {Uint32Array} fold_cols_names
 * @param {number} n_input_rows
 * @param {number} n_keep_cols
 * @param {number} n_fold_cols
 * @returns {PivotLongerResult}
 */
export function pivot_longer_typed_numeric(
  keep_cols_data,
  fold_cols_data,
  fold_cols_valid,
  fold_cols_names,
  n_input_rows,
  n_keep_cols,
  n_fold_cols,
) {
  const ret = wasm.pivot_longer_typed_numeric(
    keep_cols_data,
    fold_cols_data,
    fold_cols_valid,
    fold_cols_names,
    n_input_rows,
    n_keep_cols,
    n_fold_cols,
  );
  return PivotLongerResult.__wrap(ret);
}

/**
 * Ultra-optimized pivot_longer for string data
 * @param {Uint32Array} keep_cols_data
 * @param {Uint32Array} fold_cols_data
 * @param {Uint32Array} fold_cols_names
 * @param {number} n_input_rows
 * @param {number} n_keep_cols
 * @param {number} n_fold_cols
 * @returns {PivotLongerStringResult}
 */
export function pivot_longer_typed_strings(
  keep_cols_data,
  fold_cols_data,
  fold_cols_names,
  n_input_rows,
  n_keep_cols,
  n_fold_cols,
) {
  const ret = wasm.pivot_longer_typed_strings(
    keep_cols_data,
    fold_cols_data,
    fold_cols_names,
    n_input_rows,
    n_keep_cols,
    n_fold_cols,
  );
  return PivotLongerStringResult.__wrap(ret);
}

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
 * @param {Uint32Array} keep_cols_data
 * @param {Float64Array} fold_cols_data
 * @param {Uint32Array} fold_cols_names
 * @param {number} n_input_rows
 * @param {number} n_keep_cols
 * @param {number} n_fold_cols
 * @returns {PivotLongerResult}
 */
export function pivot_longer_dense(
  keep_cols_data,
  fold_cols_data,
  fold_cols_names,
  n_input_rows,
  n_keep_cols,
  n_fold_cols,
) {
  const ptr0 = passArray32ToWasm0(keep_cols_data, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passArrayF64ToWasm0(fold_cols_data, wasm.__wbindgen_malloc);
  const len1 = WASM_VECTOR_LEN;
  const ptr2 = passArray32ToWasm0(fold_cols_names, wasm.__wbindgen_malloc);
  const len2 = WASM_VECTOR_LEN;
  const ret = wasm.pivot_longer_dense(
    ptr0,
    len0,
    ptr1,
    len1,
    ptr2,
    len2,
    n_input_rows,
    n_keep_cols,
    n_fold_cols,
  );
  return PivotLongerResult.__wrap(ret);
}

/**
 * Optimized pivot_longer for the common case of numeric values
 * This version handles NaN/undefined values appropriately
 * @param {Uint32Array} keep_cols_data
 * @param {Float64Array} fold_cols_data
 * @param {Uint8Array} fold_cols_valid
 * @param {Uint32Array} fold_cols_names
 * @param {number} n_input_rows
 * @param {number} n_keep_cols
 * @param {number} n_fold_cols
 * @returns {PivotLongerResult}
 */
export function pivot_longer_numeric(
  keep_cols_data,
  fold_cols_data,
  fold_cols_valid,
  fold_cols_names,
  n_input_rows,
  n_keep_cols,
  n_fold_cols,
) {
  const ptr0 = passArray32ToWasm0(keep_cols_data, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passArrayF64ToWasm0(fold_cols_data, wasm.__wbindgen_malloc);
  const len1 = WASM_VECTOR_LEN;
  const ptr2 = passArray8ToWasm0(fold_cols_valid, wasm.__wbindgen_malloc);
  const len2 = WASM_VECTOR_LEN;
  const ptr3 = passArray32ToWasm0(fold_cols_names, wasm.__wbindgen_malloc);
  const len3 = WASM_VECTOR_LEN;
  const ret = wasm.pivot_longer_numeric(
    ptr0,
    len0,
    ptr1,
    len1,
    ptr2,
    len2,
    ptr3,
    len3,
    n_input_rows,
    n_keep_cols,
    n_fold_cols,
  );
  return PivotLongerResult.__wrap(ret);
}

/**
 * Fast pivot_longer specifically for string columns
 * Returns dictionary codes that can be decoded in TypeScript
 * @param {Uint32Array} keep_cols_data
 * @param {Uint32Array} fold_cols_data
 * @param {Uint32Array} fold_cols_names
 * @param {number} n_input_rows
 * @param {number} n_keep_cols
 * @param {number} n_fold_cols
 * @returns {PivotLongerStringResult}
 */
export function pivot_longer_strings(
  keep_cols_data,
  fold_cols_data,
  fold_cols_names,
  n_input_rows,
  n_keep_cols,
  n_fold_cols,
) {
  const ptr0 = passArray32ToWasm0(keep_cols_data, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passArray32ToWasm0(fold_cols_data, wasm.__wbindgen_malloc);
  const len1 = WASM_VECTOR_LEN;
  const ptr2 = passArray32ToWasm0(fold_cols_names, wasm.__wbindgen_malloc);
  const len2 = WASM_VECTOR_LEN;
  const ret = wasm.pivot_longer_strings(
    ptr0,
    len0,
    ptr1,
    len1,
    ptr2,
    len2,
    n_input_rows,
    n_keep_cols,
    n_fold_cols,
  );
  return PivotLongerStringResult.__wrap(ret);
}

/**
 * policy: 0=first, 1=last, 2=sum, 3=mean
 * @param {Uint32Array} gid_per_row
 * @param {Uint32Array} cat_codes
 * @param {Float64Array} values
 * @param {number} n_groups
 * @param {number} n_cats
 * @param {number} policy
 * @returns {Float64Array}
 */
export function pivot_wider_dense_f64(
  gid_per_row,
  cat_codes,
  values,
  n_groups,
  n_cats,
  policy,
) {
  const ptr0 = passArray32ToWasm0(gid_per_row, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passArray32ToWasm0(cat_codes, wasm.__wbindgen_malloc);
  const len1 = WASM_VECTOR_LEN;
  const ptr2 = passArrayF64ToWasm0(values, wasm.__wbindgen_malloc);
  const len2 = WASM_VECTOR_LEN;
  const ret = wasm.pivot_wider_dense_f64(
    ptr0,
    len0,
    ptr1,
    len1,
    ptr2,
    len2,
    n_groups,
    n_cats,
    policy,
  );
  var v4 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
  wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
  return v4;
}

/**
 * Get seen flags from dense pivot operation
 *
 * This function needs to be called after pivot_wider_dense_f64 to get
 * the seen flags indicating which cells have values.
 * @param {Uint32Array} gid_per_row
 * @param {Uint32Array} cat_codes
 * @param {Float64Array} _values
 * @param {number} n_groups
 * @param {number} n_cats
 * @param {number} _policy
 * @returns {Uint8Array}
 */
export function pivot_wider_seen_flags(
  gid_per_row,
  cat_codes,
  _values,
  n_groups,
  n_cats,
  _policy,
) {
  const ptr0 = passArray32ToWasm0(gid_per_row, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passArray32ToWasm0(cat_codes, wasm.__wbindgen_malloc);
  const len1 = WASM_VECTOR_LEN;
  const ptr2 = passArrayF64ToWasm0(_values, wasm.__wbindgen_malloc);
  const len2 = WASM_VECTOR_LEN;
  const ret = wasm.pivot_wider_seen_flags(
    ptr0,
    len0,
    ptr1,
    len1,
    ptr2,
    len2,
    n_groups,
    n_cats,
    _policy,
  );
  var v4 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
  wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
  return v4;
}

/**
 * Combined pivot operation that returns values and seen flags in one pass
 * policy: 0=first, 1=last, 2=sum, 3=mean
 * @param {Uint32Array} gid_per_row
 * @param {Uint32Array} cat_codes
 * @param {Float64Array} values
 * @param {number} n_groups
 * @param {number} n_cats
 * @param {number} policy
 * @returns {PivotDenseF64}
 */
export function pivot_wider_dense_f64_all(
  gid_per_row,
  cat_codes,
  values,
  n_groups,
  n_cats,
  policy,
) {
  const ptr0 = passArray32ToWasm0(gid_per_row, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passArray32ToWasm0(cat_codes, wasm.__wbindgen_malloc);
  const len1 = WASM_VECTOR_LEN;
  const ptr2 = passArrayF64ToWasm0(values, wasm.__wbindgen_malloc);
  const len2 = WASM_VECTOR_LEN;
  const ret = wasm.pivot_wider_dense_f64_all(
    ptr0,
    len0,
    ptr1,
    len1,
    ptr2,
    len2,
    n_groups,
    n_cats,
    policy,
  );
  return PivotDenseF64.__wrap(ret);
}

/**
 * WASM export for general quantile calculation
 * Uses R's Type 7 algorithm (default)
 * @param {Float64Array} data
 * @param {Float64Array} probs
 * @returns {Float64Array}
 */
export function quantile_wasm(data, probs) {
  const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passArrayF64ToWasm0(probs, wasm.__wbindgen_malloc);
  const len1 = WASM_VECTOR_LEN;
  const ret = wasm.quantile_wasm(ptr0, len0, ptr1, len1);
  if (ret[3]) {
    throw takeFromExternrefTable0(ret[2]);
  }
  var v3 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
  wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
  return v3;
}

/**
 * Ultra-optimized right join using shared utilities and specialized kernels
 * @param {Uint32Array[]} left_columns
 * @param {Uint32Array[]} right_columns
 * @returns {JoinIdxU32}
 */
export function right_join_typed_multi_u32(left_columns, right_columns) {
  const ptr0 = passArrayJsValueToWasm0(left_columns, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passArrayJsValueToWasm0(right_columns, wasm.__wbindgen_malloc);
  const len1 = WASM_VECTOR_LEN;
  const ret = wasm.right_join_typed_multi_u32(ptr0, len0, ptr1, len1);
  return JoinIdxU32.__wrap(ret);
}

/**
 * WASM export for sum calculation
 * @param {Float64Array} values
 * @returns {number}
 */
export function sum_wasm(values) {
  const ptr0 = passArrayF64ToWasm0(values, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ret = wasm.sum_wasm(ptr0, len0);
  return ret;
}

/**
 * WASM export for unique f64 values
 * @param {Float64Array} values
 * @returns {Float64Array}
 */
export function unique_f64(values) {
  const ptr0 = passArrayF64ToWasm0(values, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ret = wasm.unique_f64(ptr0, len0);
  var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
  wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
  return v2;
}

let cachedInt32ArrayMemory0 = null;

function getInt32ArrayMemory0() {
  if (
    cachedInt32ArrayMemory0 === null || cachedInt32ArrayMemory0.byteLength === 0
  ) {
    cachedInt32ArrayMemory0 = new Int32Array(wasm.memory.buffer);
  }
  return cachedInt32ArrayMemory0;
}

function getArrayI32FromWasm0(ptr, len) {
  ptr = ptr >>> 0;
  return getInt32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}
/**
 * WASM export for unique i32 values
 * @param {Int32Array} values
 * @returns {Int32Array}
 */
export function unique_i32(values) {
  const ptr0 = passArray32ToWasm0(values, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ret = wasm.unique_i32(ptr0, len0);
  var v2 = getArrayI32FromWasm0(ret[0], ret[1]).slice();
  wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
  return v2;
}

function getArrayJsValueFromWasm0(ptr, len) {
  ptr = ptr >>> 0;
  const mem = getDataViewMemory0();
  const result = [];
  for (let i = ptr; i < ptr + 4 * len; i += 4) {
    result.push(wasm.__wbindgen_export_0.get(mem.getUint32(i, true)));
  }
  wasm.__externref_drop_slice(ptr, len);
  return result;
}
/**
 * WASM export for unique string values
 * @param {string[]} values
 * @returns {string[]}
 */
export function unique_str(values) {
  const ptr0 = passArrayJsValueToWasm0(values, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ret = wasm.unique_str(ptr0, len0);
  var v2 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
  wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
  return v2;
}

/**
 * @returns {number}
 */
export function wasm_test() {
  const ret = wasm.wasm_test();
  return ret;
}

const GroupingFinalization = (typeof FinalizationRegistry === "undefined")
  ? { register: () => {}, unregister: () => {} }
  : new FinalizationRegistry((ptr) => wasm.__wbg_grouping_free(ptr >>> 0, 1));
/**
 * Grouping result that contains all information in one pass
 */
export class Grouping {
  static __wrap(ptr) {
    ptr = ptr >>> 0;
    const obj = Object.create(Grouping.prototype);
    obj.__wbg_ptr = ptr;
    GroupingFinalization.register(obj, obj.__wbg_ptr, obj);
    return obj;
  }

  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    GroupingFinalization.unregister(this);
    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_grouping_free(ptr, 0);
  }
  /**
   * @returns {number}
   */
  get n_groups() {
    const ret = wasm.__wbg_get_grouping_n_groups(this.__wbg_ptr);
    return ret >>> 0;
  }
  /**
   * @param {number} arg0
   */
  set n_groups(arg0) {
    wasm.__wbg_set_grouping_n_groups(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {number}
   */
  get n_key_cols() {
    const ret = wasm.__wbg_get_grouping_n_key_cols(this.__wbg_ptr);
    return ret >>> 0;
  }
  /**
   * @param {number} arg0
   */
  set n_key_cols(arg0) {
    wasm.__wbg_set_grouping_n_key_cols(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {Uint32Array}
   */
  takeGidPerRow() {
    const ret = wasm.grouping_takeGidPerRow(this.__wbg_ptr);
    var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
    return v1;
  }
  /**
   * @returns {Uint32Array}
   */
  takeUniqueKeys() {
    const ret = wasm.grouping_takeUniqueKeys(this.__wbg_ptr);
    var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
    return v1;
  }
}

const JoinIdxU32Finalization = (typeof FinalizationRegistry === "undefined")
  ? { register: () => {}, unregister: () => {} }
  : new FinalizationRegistry((ptr) => wasm.__wbg_joinidxu32_free(ptr >>> 0, 1));
/**
 * Optimized WASM join result using packed u32 arrays with sentinel values
 */
export class JoinIdxU32 {
  static __wrap(ptr) {
    ptr = ptr >>> 0;
    const obj = Object.create(JoinIdxU32.prototype);
    obj.__wbg_ptr = ptr;
    JoinIdxU32Finalization.register(obj, obj.__wbg_ptr, obj);
    return obj;
  }

  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    JoinIdxU32Finalization.unregister(this);
    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_joinidxu32_free(ptr, 0);
  }
  /**
   * Move out the left indices (no clone)
   * @returns {Uint32Array}
   */
  takeLeft() {
    const ret = wasm.joinidxu32_takeLeft(this.__wbg_ptr);
    var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
    return v1;
  }
  /**
   * Move out the right indices (no clone)
   * @returns {Uint32Array}
   */
  takeRight() {
    const ret = wasm.joinidxu32_takeRight(this.__wbg_ptr);
    var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
    return v1;
  }
}

const PivotDenseF64Finalization = (typeof FinalizationRegistry === "undefined")
  ? { register: () => {}, unregister: () => {} }
  : new FinalizationRegistry((ptr) =>
    wasm.__wbg_pivotdensef64_free(ptr >>> 0, 1)
  );
/**
 * Combined pivot result with values and seen flags
 */
export class PivotDenseF64 {
  static __wrap(ptr) {
    ptr = ptr >>> 0;
    const obj = Object.create(PivotDenseF64.prototype);
    obj.__wbg_ptr = ptr;
    PivotDenseF64Finalization.register(obj, obj.__wbg_ptr, obj);
    return obj;
  }

  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    PivotDenseF64Finalization.unregister(this);
    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_pivotdensef64_free(ptr, 0);
  }
  /**
   * @returns {number}
   */
  get n_groups() {
    const ret = wasm.__wbg_get_grouping_n_groups(this.__wbg_ptr);
    return ret >>> 0;
  }
  /**
   * @param {number} arg0
   */
  set n_groups(arg0) {
    wasm.__wbg_set_grouping_n_groups(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {number}
   */
  get n_cats() {
    const ret = wasm.__wbg_get_grouping_n_key_cols(this.__wbg_ptr);
    return ret >>> 0;
  }
  /**
   * @param {number} arg0
   */
  set n_cats(arg0) {
    wasm.__wbg_set_grouping_n_key_cols(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {Float64Array}
   */
  takeValues() {
    const ret = wasm.pivotdensef64_takeValues(this.__wbg_ptr);
    var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v1;
  }
  /**
   * @returns {Uint8Array}
   */
  takeSeen() {
    const ret = wasm.pivotdensef64_takeSeen(this.__wbg_ptr);
    var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    return v1;
  }
}

const PivotLongerResultFinalization =
  (typeof FinalizationRegistry === "undefined")
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry((ptr) =>
      wasm.__wbg_pivotlongerresult_free(ptr >>> 0, 1)
    );
/**
 * Result of pivot_longer operation containing reshaped data
 */
export class PivotLongerResult {
  static __wrap(ptr) {
    ptr = ptr >>> 0;
    const obj = Object.create(PivotLongerResult.prototype);
    obj.__wbg_ptr = ptr;
    PivotLongerResultFinalization.register(obj, obj.__wbg_ptr, obj);
    return obj;
  }

  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    PivotLongerResultFinalization.unregister(this);
    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_pivotlongerresult_free(ptr, 0);
  }
  /**
   * @returns {number}
   */
  get n_rows() {
    const ret = wasm.__wbg_get_pivotlongerresult_n_rows(this.__wbg_ptr);
    return ret >>> 0;
  }
  /**
   * @param {number} arg0
   */
  set n_rows(arg0) {
    wasm.__wbg_set_pivotlongerresult_n_rows(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {number}
   */
  get n_keep_cols() {
    const ret = wasm.__wbg_get_pivotlongerresult_n_keep_cols(this.__wbg_ptr);
    return ret >>> 0;
  }
  /**
   * @param {number} arg0
   */
  set n_keep_cols(arg0) {
    wasm.__wbg_set_pivotlongerresult_n_keep_cols(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {Uint32Array}
   */
  takeKeepData() {
    const ret = wasm.pivotlongerresult_takeKeepData(this.__wbg_ptr);
    var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
    return v1;
  }
  /**
   * @returns {Uint32Array}
   */
  takeNamesData() {
    const ret = wasm.pivotlongerresult_takeNamesData(this.__wbg_ptr);
    var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
    return v1;
  }
  /**
   * @returns {Float64Array}
   */
  takeValuesData() {
    const ret = wasm.pivotlongerresult_takeValuesData(this.__wbg_ptr);
    var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v1;
  }
}

const PivotLongerStringResultFinalization =
  (typeof FinalizationRegistry === "undefined")
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry((ptr) =>
      wasm.__wbg_pivotlongerstringresult_free(ptr >>> 0, 1)
    );
/**
 * Result for string pivot_longer operations
 */
export class PivotLongerStringResult {
  static __wrap(ptr) {
    ptr = ptr >>> 0;
    const obj = Object.create(PivotLongerStringResult.prototype);
    obj.__wbg_ptr = ptr;
    PivotLongerStringResultFinalization.register(obj, obj.__wbg_ptr, obj);
    return obj;
  }

  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    PivotLongerStringResultFinalization.unregister(this);
    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_pivotlongerstringresult_free(ptr, 0);
  }
  /**
   * @returns {number}
   */
  get n_rows() {
    const ret = wasm.__wbg_get_pivotlongerresult_n_rows(this.__wbg_ptr);
    return ret >>> 0;
  }
  /**
   * @param {number} arg0
   */
  set n_rows(arg0) {
    wasm.__wbg_set_pivotlongerresult_n_rows(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {number}
   */
  get n_keep_cols() {
    const ret = wasm.__wbg_get_pivotlongerresult_n_keep_cols(this.__wbg_ptr);
    return ret >>> 0;
  }
  /**
   * @param {number} arg0
   */
  set n_keep_cols(arg0) {
    wasm.__wbg_set_pivotlongerresult_n_keep_cols(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {Uint32Array}
   */
  takeKeepData() {
    const ret = wasm.pivotlongerstringresult_takeKeepData(this.__wbg_ptr);
    var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
    return v1;
  }
  /**
   * @returns {Uint32Array}
   */
  takeNamesData() {
    const ret = wasm.pivotlongerstringresult_takeNamesData(this.__wbg_ptr);
    var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
    return v1;
  }
  /**
   * @returns {Uint32Array}
   */
  takeValuesData() {
    const ret = wasm.pivotlongerstringresult_takeValuesData(this.__wbg_ptr);
    var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
    return v1;
  }
}

export function __wbg_buffer_609cc3eee51ed158(arg0) {
  const ret = arg0.buffer;
  return ret;
}

export function __wbg_getindex_d332410fbea81873(arg0, arg1) {
  const ret = arg0[arg1 >>> 0];
  return ret;
}

export function __wbg_length_6ca527665d89694d(arg0) {
  const ret = arg0.length;
  return ret;
}

export function __wbg_length_a446193dc22c12f8(arg0) {
  const ret = arg0.length;
  return ret;
}

export function __wbg_length_c67d5e5c3b83737f(arg0) {
  const ret = arg0.length;
  return ret;
}

export function __wbg_new_78c8a92080461d08(arg0) {
  const ret = new Float64Array(arg0);
  return ret;
}

export function __wbg_new_a12002a7f91c75be(arg0) {
  const ret = new Uint8Array(arg0);
  return ret;
}

export function __wbg_new_e3b321dcfef89fc7(arg0) {
  const ret = new Uint32Array(arg0);
  return ret;
}

export function __wbg_set_29b6f95e6adb667e(arg0, arg1, arg2) {
  arg0.set(arg1, arg2 >>> 0);
}

export function __wbg_set_65595bdd868b3009(arg0, arg1, arg2) {
  arg0.set(arg1, arg2 >>> 0);
}

export function __wbg_set_d23661d19148b229(arg0, arg1, arg2) {
  arg0.set(arg1, arg2 >>> 0);
}

export function __wbindgen_copy_to_typed_array(arg0, arg1, arg2) {
  new Uint8Array(arg2.buffer, arg2.byteOffset, arg2.byteLength).set(
    getArrayU8FromWasm0(arg0, arg1),
  );
}

export function __wbindgen_init_externref_table() {
  const table = wasm.__wbindgen_export_0;
  const offset = table.grow(4);
  table.set(0, undefined);
  table.set(offset + 0, undefined);
  table.set(offset + 1, null);
  table.set(offset + 2, true);
  table.set(offset + 3, false);
}

export function __wbindgen_memory() {
  const ret = wasm.memory;
  return ret;
}

export function __wbindgen_string_get(arg0, arg1) {
  const obj = arg1;
  const ret = typeof obj === "string" ? obj : undefined;
  var ptr1 = isLikeNone(ret)
    ? 0
    : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
  var len1 = WASM_VECTOR_LEN;
  getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
  getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
}

export function __wbindgen_string_new(arg0, arg1) {
  const ret = getStringFromWasm0(arg0, arg1);
  return ret;
}

export function __wbindgen_throw(arg0, arg1) {
  throw new Error(getStringFromWasm0(arg0, arg1));
}
