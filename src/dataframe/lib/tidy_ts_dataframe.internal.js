// @generated file from wasmbuild -- do not edit
// @ts-nocheck: generated
// deno-lint-ignore-file
// deno-fmt-ignore-file

let wasm;
export function __wbg_set_wasm(val) {
  wasm = val;
}

function addToExternrefTable0(obj) {
  const idx = wasm.__externref_table_alloc();
  wasm.__wbindgen_export_2.set(idx, obj);
  return idx;
}

function handleError(f, args) {
  try {
    return f.apply(this, args);
  } catch (e) {
    const idx = addToExternrefTable0(e);
    wasm.__wbindgen_exn_store(idx);
  }
}

const lTextDecoder = typeof TextDecoder === "undefined"
  ? (0, module.require)("util").TextDecoder
  : TextDecoder;

let cachedTextDecoder = new lTextDecoder("utf-8", {
  ignoreBOM: true,
  fatal: true,
});

cachedTextDecoder.decode();

let cachedUint8ArrayMemory0 = null;

function getUint8ArrayMemory0() {
  if (
    cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0
  ) {
    cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
  }
  return cachedUint8ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
  ptr = ptr >>> 0;
  return cachedTextDecoder.decode(
    getUint8ArrayMemory0().subarray(ptr, ptr + len),
  );
}

function isLikeNone(x) {
  return x === undefined || x === null;
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
  const value = wasm.__wbindgen_export_2.get(idx);
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
    result.push(wasm.__wbindgen_export_2.get(mem.getUint32(i, true)));
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

function _assertClass(instance, klass) {
  if (!(instance instanceof klass)) {
    throw new Error(`expected instance of ${klass.name}`);
  }
}
/**
 * WASM export for beta density function
 * @param {number} x
 * @param {number} shape1
 * @param {number} shape2
 * @param {boolean} give_log
 * @returns {number}
 */
export function wasm_dbeta(x, shape1, shape2, give_log) {
  const ret = wasm.wasm_dbeta(x, shape1, shape2, give_log);
  return ret;
}

/**
 * WASM export for beta cumulative distribution function
 * @param {number} x
 * @param {number} shape1
 * @param {number} shape2
 * @param {boolean} lower_tail
 * @param {boolean} log_p
 * @returns {number}
 */
export function wasm_pbeta(x, shape1, shape2, lower_tail, log_p) {
  const ret = wasm.wasm_pbeta(x, shape1, shape2, lower_tail, log_p);
  return ret;
}

/**
 * WASM export for beta quantile function
 * @param {number} p
 * @param {number} shape1
 * @param {number} shape2
 * @param {boolean} lower_tail
 * @param {boolean} log_p
 * @returns {number}
 */
export function wasm_qbeta(p, shape1, shape2, lower_tail, log_p) {
  const ret = wasm.wasm_qbeta(p, shape1, shape2, lower_tail, log_p);
  return ret;
}

/**
 * WASM export for beta random number generation
 * @param {number} shape1
 * @param {number} shape2
 * @returns {number}
 */
export function wasm_rbeta(shape1, shape2) {
  const ret = wasm.wasm_rbeta(shape1, shape2);
  return ret;
}

/**
 * WASM export for normal density function
 * @param {number} x
 * @param {number} mean
 * @param {number} sd
 * @param {boolean} give_log
 * @returns {number}
 */
export function wasm_dnorm(x, mean, sd, give_log) {
  const ret = wasm.wasm_dnorm(x, mean, sd, give_log);
  return ret;
}

/**
 * WASM export for normal cumulative distribution function
 * @param {number} x
 * @param {number} mean
 * @param {number} sd
 * @param {boolean} lower_tail
 * @param {boolean} log_p
 * @returns {number}
 */
export function wasm_pnorm(x, mean, sd, lower_tail, log_p) {
  const ret = wasm.wasm_pnorm(x, mean, sd, lower_tail, log_p);
  return ret;
}

/**
 * WASM export for normal quantile function
 * @param {number} p
 * @param {number} mean
 * @param {number} sd
 * @param {boolean} lower_tail
 * @param {boolean} log_p
 * @returns {number}
 */
export function wasm_qnorm(p, mean, sd, lower_tail, log_p) {
  const ret = wasm.wasm_qnorm(p, mean, sd, lower_tail, log_p);
  return ret;
}

/**
 * WASM export for normal random number generation
 * @param {number} mean
 * @param {number} sd
 * @returns {number}
 */
export function wasm_rnorm(mean, sd) {
  const ret = wasm.wasm_rnorm(mean, sd);
  return ret;
}

/**
 * WASM export for gamma density function
 * @param {number} x
 * @param {number} shape
 * @param {number} rate
 * @param {boolean} give_log
 * @returns {number}
 */
export function wasm_dgamma(x, shape, rate, give_log) {
  const ret = wasm.wasm_dgamma(x, shape, rate, give_log);
  return ret;
}

/**
 * WASM export for gamma cumulative distribution function
 * @param {number} x
 * @param {number} shape
 * @param {number} rate
 * @param {boolean} lower_tail
 * @param {boolean} log_p
 * @returns {number}
 */
export function wasm_pgamma(x, shape, rate, lower_tail, log_p) {
  const ret = wasm.wasm_pgamma(x, shape, rate, lower_tail, log_p);
  return ret;
}

/**
 * WASM export for gamma quantile function
 * @param {number} p
 * @param {number} shape
 * @param {number} rate
 * @param {boolean} lower_tail
 * @param {boolean} log_p
 * @returns {number}
 */
export function wasm_qgamma(p, shape, rate, lower_tail, log_p) {
  const ret = wasm.wasm_qgamma(p, shape, rate, lower_tail, log_p);
  return ret;
}

/**
 * WASM export for gamma random number generation
 * @param {number} shape
 * @param {number} rate
 * @returns {number}
 */
export function wasm_rgamma(shape, rate) {
  const ret = wasm.wasm_rgamma(shape, rate);
  return ret;
}

/**
 * WASM export for exponential density function
 * @param {number} x
 * @param {number} rate
 * @param {boolean} give_log
 * @returns {number}
 */
export function wasm_dexp(x, rate, give_log) {
  const ret = wasm.wasm_dexp(x, rate, give_log);
  return ret;
}

/**
 * WASM export for exponential cumulative distribution function
 * @param {number} x
 * @param {number} rate
 * @param {boolean} lower_tail
 * @param {boolean} log_p
 * @returns {number}
 */
export function wasm_pexp(x, rate, lower_tail, log_p) {
  const ret = wasm.wasm_pexp(x, rate, lower_tail, log_p);
  return ret;
}

/**
 * WASM export for exponential quantile function
 * @param {number} p
 * @param {number} rate
 * @param {boolean} lower_tail
 * @param {boolean} log_p
 * @returns {number}
 */
export function wasm_qexp(p, rate, lower_tail, log_p) {
  const ret = wasm.wasm_qexp(p, rate, lower_tail, log_p);
  return ret;
}

/**
 * WASM export for exponential random number generation
 * @param {number} rate
 * @returns {number}
 */
export function wasm_rexp(rate) {
  const ret = wasm.wasm_rexp(rate);
  return ret;
}

/**
 * WASM export for chi-squared density function
 * @param {number} x
 * @param {number} df
 * @param {boolean} give_log
 * @returns {number}
 */
export function wasm_dchisq(x, df, give_log) {
  const ret = wasm.wasm_dchisq(x, df, give_log);
  return ret;
}

/**
 * WASM export for chi-squared cumulative distribution function
 * @param {number} x
 * @param {number} df
 * @param {boolean} lower_tail
 * @param {boolean} log_p
 * @returns {number}
 */
export function wasm_pchisq(x, df, lower_tail, log_p) {
  const ret = wasm.wasm_pchisq(x, df, lower_tail, log_p);
  return ret;
}

/**
 * WASM export for chi-squared quantile function
 * @param {number} p
 * @param {number} df
 * @param {boolean} lower_tail
 * @param {boolean} log_p
 * @returns {number}
 */
export function wasm_qchisq(p, df, lower_tail, log_p) {
  const ret = wasm.wasm_qchisq(p, df, lower_tail, log_p);
  return ret;
}

/**
 * WASM export for chi-squared random number generation
 * @param {number} df
 * @returns {number}
 */
export function wasm_rchisq(df) {
  const ret = wasm.wasm_rchisq(df);
  return ret;
}

/**
 * WASM export for F density function
 * @param {number} x
 * @param {number} df1
 * @param {number} df2
 * @param {boolean} give_log
 * @returns {number}
 */
export function wasm_df(x, df1, df2, give_log) {
  const ret = wasm.wasm_df(x, df1, df2, give_log);
  return ret;
}

/**
 * WASM export for F cumulative distribution function
 * @param {number} x
 * @param {number} df1
 * @param {number} df2
 * @param {boolean} lower_tail
 * @param {boolean} log_p
 * @returns {number}
 */
export function wasm_pf(x, df1, df2, lower_tail, log_p) {
  const ret = wasm.wasm_pf(x, df1, df2, lower_tail, log_p);
  return ret;
}

/**
 * WASM export for F quantile function
 * @param {number} p
 * @param {number} df1
 * @param {number} df2
 * @param {boolean} lower_tail
 * @param {boolean} log_p
 * @returns {number}
 */
export function wasm_qf(p, df1, df2, lower_tail, log_p) {
  const ret = wasm.wasm_qf(p, df1, df2, lower_tail, log_p);
  return ret;
}

/**
 * WASM export for F distribution random number generation
 * @param {number} df1
 * @param {number} df2
 * @returns {number}
 */
export function wasm_rf(df1, df2) {
  const ret = wasm.wasm_rf(df1, df2);
  return ret;
}

/**
 * WASM export for t density function
 * @param {number} x
 * @param {number} df
 * @param {boolean} give_log
 * @returns {number}
 */
export function wasm_dt(x, df, give_log) {
  const ret = wasm.wasm_dt(x, df, give_log);
  return ret;
}

/**
 * WASM export for t cumulative distribution function
 * @param {number} x
 * @param {number} df
 * @param {boolean} lower_tail
 * @param {boolean} log_p
 * @returns {number}
 */
export function wasm_pt(x, df, lower_tail, log_p) {
  const ret = wasm.wasm_pt(x, df, lower_tail, log_p);
  return ret;
}

/**
 * WASM export for t quantile function
 * @param {number} p
 * @param {number} df
 * @param {boolean} lower_tail
 * @param {boolean} log_p
 * @returns {number}
 */
export function wasm_qt(p, df, lower_tail, log_p) {
  const ret = wasm.wasm_qt(p, df, lower_tail, log_p);
  return ret;
}

/**
 * WASM export for t distribution random number generation
 * @param {number} df
 * @returns {number}
 */
export function wasm_rt(df) {
  const ret = wasm.wasm_rt(df);
  return ret;
}

/**
 * WASM export for Poisson density function
 * @param {number} x
 * @param {number} lambda
 * @param {boolean} give_log
 * @returns {number}
 */
export function wasm_dpois(x, lambda, give_log) {
  const ret = wasm.wasm_dpois(x, lambda, give_log);
  return ret;
}

/**
 * WASM export for Poisson cumulative distribution function
 * @param {number} x
 * @param {number} lambda
 * @param {boolean} lower_tail
 * @param {boolean} log_p
 * @returns {number}
 */
export function wasm_ppois(x, lambda, lower_tail, log_p) {
  const ret = wasm.wasm_ppois(x, lambda, lower_tail, log_p);
  return ret;
}

/**
 * WASM export for Poisson quantile function
 * @param {number} p
 * @param {number} lambda
 * @param {boolean} lower_tail
 * @param {boolean} log_p
 * @returns {number}
 */
export function wasm_qpois(p, lambda, lower_tail, log_p) {
  const ret = wasm.wasm_qpois(p, lambda, lower_tail, log_p);
  return ret;
}

/**
 * WASM export for Poisson random number generation
 * @param {number} lambda
 * @returns {number}
 */
export function wasm_rpois(lambda) {
  const ret = wasm.wasm_rpois(lambda);
  return ret;
}

/**
 * WASM export for binomial density function
 * @param {number} x
 * @param {number} size
 * @param {number} prob
 * @param {boolean} give_log
 * @returns {number}
 */
export function wasm_dbinom(x, size, prob, give_log) {
  const ret = wasm.wasm_dbinom(x, size, prob, give_log);
  return ret;
}

/**
 * WASM export for binomial cumulative distribution function
 * @param {number} x
 * @param {number} size
 * @param {number} prob
 * @param {boolean} lower_tail
 * @param {boolean} log_p
 * @returns {number}
 */
export function wasm_pbinom(x, size, prob, lower_tail, log_p) {
  const ret = wasm.wasm_pbinom(x, size, prob, lower_tail, log_p);
  return ret;
}

/**
 * WASM export for binomial quantile function
 * @param {number} p
 * @param {number} size
 * @param {number} prob
 * @param {boolean} lower_tail
 * @param {boolean} log_p
 * @returns {number}
 */
export function wasm_qbinom(p, size, prob, lower_tail, log_p) {
  const ret = wasm.wasm_qbinom(p, size, prob, lower_tail, log_p);
  return ret;
}

/**
 * WASM export for binomial random number generation
 * @param {number} size
 * @param {number} prob
 * @returns {number}
 */
export function wasm_rbinom(size, prob) {
  const ret = wasm.wasm_rbinom(size, prob);
  return ret;
}

/**
 * WASM export for uniform density function
 * @param {number} x
 * @param {number} min
 * @param {number} max
 * @param {boolean} give_log
 * @returns {number}
 */
export function wasm_dunif(x, min, max, give_log) {
  const ret = wasm.wasm_dunif(x, min, max, give_log);
  return ret;
}

/**
 * WASM export for uniform cumulative distribution function
 * @param {number} x
 * @param {number} min
 * @param {number} max
 * @param {boolean} lower_tail
 * @param {boolean} log_p
 * @returns {number}
 */
export function wasm_punif(x, min, max, lower_tail, log_p) {
  const ret = wasm.wasm_punif(x, min, max, lower_tail, log_p);
  return ret;
}

/**
 * WASM export for uniform quantile function
 * @param {number} p
 * @param {number} min
 * @param {number} max
 * @param {boolean} lower_tail
 * @param {boolean} log_p
 * @returns {number}
 */
export function wasm_qunif(p, min, max, lower_tail, log_p) {
  const ret = wasm.wasm_qunif(p, min, max, lower_tail, log_p);
  return ret;
}

/**
 * WASM export for uniform random number generation
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function wasm_runif(min, max) {
  const ret = wasm.wasm_runif(min, max);
  return ret;
}

/**
 * WASM export for Weibull density function
 * @param {number} x
 * @param {number} shape
 * @param {number} scale
 * @param {boolean} give_log
 * @returns {number}
 */
export function wasm_dweibull(x, shape, scale, give_log) {
  const ret = wasm.wasm_dweibull(x, shape, scale, give_log);
  return ret;
}

/**
 * WASM export for Weibull cumulative distribution function
 * @param {number} x
 * @param {number} shape
 * @param {number} scale
 * @param {boolean} lower_tail
 * @param {boolean} log_p
 * @returns {number}
 */
export function wasm_pweibull(x, shape, scale, lower_tail, log_p) {
  const ret = wasm.wasm_pweibull(x, shape, scale, lower_tail, log_p);
  return ret;
}

/**
 * WASM export for Weibull quantile function
 * @param {number} p
 * @param {number} shape
 * @param {number} scale
 * @param {boolean} lower_tail
 * @param {boolean} log_p
 * @returns {number}
 */
export function wasm_qweibull(p, shape, scale, lower_tail, log_p) {
  const ret = wasm.wasm_qweibull(p, shape, scale, lower_tail, log_p);
  return ret;
}

/**
 * WASM export for Weibull random number generation
 * @param {number} shape
 * @param {number} scale
 * @returns {number}
 */
export function wasm_rweibull(shape, scale) {
  const ret = wasm.wasm_rweibull(shape, scale);
  return ret;
}

/**
 * WASM export for geometric density function
 * @param {number} x
 * @param {number} prob
 * @param {boolean} give_log
 * @returns {number}
 */
export function wasm_dgeom(x, prob, give_log) {
  const ret = wasm.wasm_dgeom(x, prob, give_log);
  return ret;
}

/**
 * WASM export for geometric cumulative distribution function
 * @param {number} x
 * @param {number} prob
 * @param {boolean} lower_tail
 * @param {boolean} log_p
 * @returns {number}
 */
export function wasm_pgeom(x, prob, lower_tail, log_p) {
  const ret = wasm.wasm_pgeom(x, prob, lower_tail, log_p);
  return ret;
}

/**
 * WASM export for geometric quantile function
 * @param {number} p
 * @param {number} prob
 * @param {boolean} lower_tail
 * @param {boolean} log_p
 * @returns {number}
 */
export function wasm_qgeom(p, prob, lower_tail, log_p) {
  const ret = wasm.wasm_qgeom(p, prob, lower_tail, log_p);
  return ret;
}

/**
 * WASM export for geometric random number generation
 * @param {number} prob
 * @returns {number}
 */
export function wasm_rgeom(prob) {
  const ret = wasm.wasm_rgeom(prob);
  return ret;
}

/**
 * WASM export for hypergeometric density function
 * @param {number} x
 * @param {number} m
 * @param {number} n
 * @param {number} k
 * @param {boolean} give_log
 * @returns {number}
 */
export function wasm_dhyper(x, m, n, k, give_log) {
  const ret = wasm.wasm_dhyper(x, m, n, k, give_log);
  return ret;
}

/**
 * WASM export for hypergeometric cumulative distribution function
 * @param {number} x
 * @param {number} m
 * @param {number} n
 * @param {number} k
 * @param {boolean} lower_tail
 * @param {boolean} log_p
 * @returns {number}
 */
export function wasm_phyper(x, m, n, k, lower_tail, log_p) {
  const ret = wasm.wasm_phyper(x, m, n, k, lower_tail, log_p);
  return ret;
}

/**
 * WASM export for hypergeometric quantile function
 * @param {number} p
 * @param {number} m
 * @param {number} n
 * @param {number} k
 * @param {boolean} lower_tail
 * @param {boolean} log_p
 * @returns {number}
 */
export function wasm_qhyper(p, m, n, k, lower_tail, log_p) {
  const ret = wasm.wasm_qhyper(p, m, n, k, lower_tail, log_p);
  return ret;
}

/**
 * WASM export for hypergeometric random number generation
 * @param {number} m
 * @param {number} n
 * @param {number} k
 * @returns {number}
 */
export function wasm_rhyper(m, n, k) {
  const ret = wasm.wasm_rhyper(m, n, k);
  return ret;
}

/**
 * WASM export for log-normal density function
 * @param {number} x
 * @param {number} meanlog
 * @param {number} sdlog
 * @param {boolean} give_log
 * @returns {number}
 */
export function wasm_dlnorm(x, meanlog, sdlog, give_log) {
  const ret = wasm.wasm_dlnorm(x, meanlog, sdlog, give_log);
  return ret;
}

/**
 * WASM export for log-normal cumulative distribution function
 * @param {number} x
 * @param {number} meanlog
 * @param {number} sdlog
 * @param {boolean} lower_tail
 * @param {boolean} log_p
 * @returns {number}
 */
export function wasm_plnorm(x, meanlog, sdlog, lower_tail, log_p) {
  const ret = wasm.wasm_plnorm(x, meanlog, sdlog, lower_tail, log_p);
  return ret;
}

/**
 * WASM export for log-normal quantile function
 * @param {number} p
 * @param {number} meanlog
 * @param {number} sdlog
 * @param {boolean} lower_tail
 * @param {boolean} log_p
 * @returns {number}
 */
export function wasm_qlnorm(p, meanlog, sdlog, lower_tail, log_p) {
  const ret = wasm.wasm_qlnorm(p, meanlog, sdlog, lower_tail, log_p);
  return ret;
}

/**
 * WASM export for log-normal random number generation
 * @param {number} meanlog
 * @param {number} sdlog
 * @returns {number}
 */
export function wasm_rlnorm(meanlog, sdlog) {
  const ret = wasm.wasm_rlnorm(meanlog, sdlog);
  return ret;
}

/**
 * WASM export for negative binomial density function
 * @param {number} x
 * @param {number} r
 * @param {number} p
 * @param {boolean} give_log
 * @returns {number}
 */
export function wasm_dnbinom(x, r, p, give_log) {
  const ret = wasm.wasm_dnbinom(x, r, p, give_log);
  return ret;
}

/**
 * WASM export for negative binomial cumulative distribution function
 * @param {number} x
 * @param {number} r
 * @param {number} p
 * @param {boolean} lower_tail
 * @param {boolean} log_p
 * @returns {number}
 */
export function wasm_pnbinom(x, r, p, lower_tail, log_p) {
  const ret = wasm.wasm_pnbinom(x, r, p, lower_tail, log_p);
  return ret;
}

/**
 * WASM export for negative binomial quantile function
 * @param {number} p
 * @param {number} r
 * @param {number} prob
 * @param {boolean} lower_tail
 * @param {boolean} log_p
 * @returns {number}
 */
export function wasm_qnbinom(p, r, prob, lower_tail, log_p) {
  const ret = wasm.wasm_qnbinom(p, r, prob, lower_tail, log_p);
  return ret;
}

/**
 * WASM export for negative binomial random number generation
 * @param {number} r
 * @param {number} prob
 * @returns {number}
 */
export function wasm_rnbinom(r, prob) {
  const ret = wasm.wasm_rnbinom(r, prob);
  return ret;
}

/**
 * WASM export for Wilcoxon density function
 * @param {number} x
 * @param {number} m
 * @param {number} n
 * @param {boolean} give_log
 * @returns {number}
 */
export function wasm_dwilcox(x, m, n, give_log) {
  const ret = wasm.wasm_dwilcox(x, m, n, give_log);
  return ret;
}

/**
 * WASM export for Wilcoxon cumulative distribution function
 * @param {number} q
 * @param {number} m
 * @param {number} n
 * @param {boolean} lower_tail
 * @param {boolean} log_p
 * @returns {number}
 */
export function wasm_pwilcox(q, m, n, lower_tail, log_p) {
  const ret = wasm.wasm_pwilcox(q, m, n, lower_tail, log_p);
  return ret;
}

/**
 * WASM export for Wilcoxon quantile function
 * @param {number} p
 * @param {number} m
 * @param {number} n
 * @param {boolean} lower_tail
 * @param {boolean} log_p
 * @returns {number}
 */
export function wasm_qwilcox(p, m, n, lower_tail, log_p) {
  const ret = wasm.wasm_qwilcox(p, m, n, lower_tail, log_p);
  return ret;
}

/**
 * WASM export for Wilcoxon random number generation
 * @param {number} m
 * @param {number} n
 * @returns {number}
 */
export function wasm_rwilcox(m, n) {
  const ret = wasm.wasm_rwilcox(m, n);
  return ret;
}

/**
 * @param {string} formula
 * @param {string} family_name
 * @param {string} link_name
 * @param {string} data_json
 * @param {string} id_json
 * @param {string | null | undefined} waves_json
 * @param {string} corstr
 * @param {string} std_err
 * @param {string | null} [options_json]
 * @returns {string}
 */
export function geeglm_fit_wasm(
  formula,
  family_name,
  link_name,
  data_json,
  id_json,
  waves_json,
  corstr,
  std_err,
  options_json,
) {
  let deferred10_0;
  let deferred10_1;
  try {
    const ptr0 = passStringToWasm0(
      formula,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(
      family_name,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
    const len1 = WASM_VECTOR_LEN;
    const ptr2 = passStringToWasm0(
      link_name,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
    const len2 = WASM_VECTOR_LEN;
    const ptr3 = passStringToWasm0(
      data_json,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
    const len3 = WASM_VECTOR_LEN;
    const ptr4 = passStringToWasm0(
      id_json,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
    const len4 = WASM_VECTOR_LEN;
    var ptr5 = isLikeNone(waves_json)
      ? 0
      : passStringToWasm0(
        waves_json,
        wasm.__wbindgen_malloc,
        wasm.__wbindgen_realloc,
      );
    var len5 = WASM_VECTOR_LEN;
    const ptr6 = passStringToWasm0(
      corstr,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
    const len6 = WASM_VECTOR_LEN;
    const ptr7 = passStringToWasm0(
      std_err,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
    const len7 = WASM_VECTOR_LEN;
    var ptr8 = isLikeNone(options_json)
      ? 0
      : passStringToWasm0(
        options_json,
        wasm.__wbindgen_malloc,
        wasm.__wbindgen_realloc,
      );
    var len8 = WASM_VECTOR_LEN;
    const ret = wasm.geeglm_fit_wasm(
      ptr0,
      len0,
      ptr1,
      len1,
      ptr2,
      len2,
      ptr3,
      len3,
      ptr4,
      len4,
      ptr5,
      len5,
      ptr6,
      len6,
      ptr7,
      len7,
      ptr8,
      len8,
    );
    deferred10_0 = ret[0];
    deferred10_1 = ret[1];
    return getStringFromWasm0(ret[0], ret[1]);
  } finally {
    wasm.__wbindgen_free(deferred10_0, deferred10_1, 1);
  }
}

/**
 * WASM export for GLM fitting
 *
 * Fits a generalized linear model using the provided formula and data.
 *
 * # Arguments
 * * `formula` - Model formula as string (e.g., "y ~ x1 + x2")
 * * `family_name` - Name of the family ("gaussian", "binomial", "poisson", etc.)
 * * `link_name` - Name of the link function ("identity", "logit", "log", etc.)
 * * `data_json` - JSON string containing the data as an object with column names as keys
 * * `options_json` - JSON string containing optional parameters
 *
 * # Returns
 * JSON string containing the fitted GLM result
 * @param {string} formula
 * @param {string} family_name
 * @param {string} link_name
 * @param {string} data_json
 * @param {string | null} [options_json]
 * @returns {string}
 */
export function glm_fit_wasm(
  formula,
  family_name,
  link_name,
  data_json,
  options_json,
) {
  let deferred6_0;
  let deferred6_1;
  try {
    const ptr0 = passStringToWasm0(
      formula,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(
      family_name,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
    const len1 = WASM_VECTOR_LEN;
    const ptr2 = passStringToWasm0(
      link_name,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
    const len2 = WASM_VECTOR_LEN;
    const ptr3 = passStringToWasm0(
      data_json,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
    const len3 = WASM_VECTOR_LEN;
    var ptr4 = isLikeNone(options_json)
      ? 0
      : passStringToWasm0(
        options_json,
        wasm.__wbindgen_malloc,
        wasm.__wbindgen_realloc,
      );
    var len4 = WASM_VECTOR_LEN;
    const ret = wasm.glm_fit_wasm(
      ptr0,
      len0,
      ptr1,
      len1,
      ptr2,
      len2,
      ptr3,
      len3,
      ptr4,
      len4,
    );
    deferred6_0 = ret[0];
    deferred6_1 = ret[1];
    return getStringFromWasm0(ret[0], ret[1]);
  } finally {
    wasm.__wbindgen_free(deferred6_0, deferred6_1, 1);
  }
}

/**
 * WASM export for one-way ANOVA
 * @param {Float64Array} data
 * @param {Uint32Array} group_sizes
 * @param {number} alpha
 * @returns {OneWayAnovaTestResult}
 */
export function anova_one_way(data, group_sizes, alpha) {
  const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passArray32ToWasm0(group_sizes, wasm.__wbindgen_malloc);
  const len1 = WASM_VECTOR_LEN;
  const ret = wasm.anova_one_way(ptr0, len0, ptr1, len1, alpha);
  return OneWayAnovaTestResult.__wrap(ret);
}

/**
 * WASM export for two-way ANOVA factor A
 * @param {Float64Array} data
 * @param {number} a_levels
 * @param {number} b_levels
 * @param {Uint32Array} cell_sizes
 * @param {number} alpha
 * @returns {OneWayAnovaTestResult}
 */
export function anova_two_way_factor_a_wasm(
  data,
  a_levels,
  b_levels,
  cell_sizes,
  alpha,
) {
  const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passArray32ToWasm0(cell_sizes, wasm.__wbindgen_malloc);
  const len1 = WASM_VECTOR_LEN;
  const ret = wasm.anova_two_way_factor_a_wasm(
    ptr0,
    len0,
    a_levels,
    b_levels,
    ptr1,
    len1,
    alpha,
  );
  return OneWayAnovaTestResult.__wrap(ret);
}

/**
 * WASM export for two-way ANOVA factor B
 * @param {Float64Array} data
 * @param {number} a_levels
 * @param {number} b_levels
 * @param {Uint32Array} cell_sizes
 * @param {number} alpha
 * @returns {OneWayAnovaTestResult}
 */
export function anova_two_way_factor_b_wasm(
  data,
  a_levels,
  b_levels,
  cell_sizes,
  alpha,
) {
  const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passArray32ToWasm0(cell_sizes, wasm.__wbindgen_malloc);
  const len1 = WASM_VECTOR_LEN;
  const ret = wasm.anova_two_way_factor_b_wasm(
    ptr0,
    len0,
    a_levels,
    b_levels,
    ptr1,
    len1,
    alpha,
  );
  return OneWayAnovaTestResult.__wrap(ret);
}

/**
 * WASM export for two-way ANOVA interaction
 * @param {Float64Array} data
 * @param {number} a_levels
 * @param {number} b_levels
 * @param {Uint32Array} cell_sizes
 * @param {number} alpha
 * @returns {OneWayAnovaTestResult}
 */
export function anova_two_way_interaction_wasm(
  data,
  a_levels,
  b_levels,
  cell_sizes,
  alpha,
) {
  const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passArray32ToWasm0(cell_sizes, wasm.__wbindgen_malloc);
  const len1 = WASM_VECTOR_LEN;
  const ret = wasm.anova_two_way_interaction_wasm(
    ptr0,
    len0,
    a_levels,
    b_levels,
    ptr1,
    len1,
    alpha,
  );
  return OneWayAnovaTestResult.__wrap(ret);
}

/**
 * WASM export for two-way ANOVA
 * Takes flattened data with group information to reconstruct 2D factorial design
 * @param {Float64Array} data
 * @param {number} a_levels
 * @param {number} b_levels
 * @param {Uint32Array} cell_sizes
 * @param {number} alpha
 * @returns {TwoWayAnovaTestResult}
 */
export function anova_two_way(data, a_levels, b_levels, cell_sizes, alpha) {
  const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passArray32ToWasm0(cell_sizes, wasm.__wbindgen_malloc);
  const len1 = WASM_VECTOR_LEN;
  const ret = wasm.anova_two_way(
    ptr0,
    len0,
    a_levels,
    b_levels,
    ptr1,
    len1,
    alpha,
  );
  return TwoWayAnovaTestResult.__wrap(ret);
}

/**
 * WASM export for Welch's ANOVA (unequal variances)
 * @param {Float64Array} data
 * @param {Uint32Array} group_sizes
 * @param {number} alpha
 * @returns {WelchAnovaTestResult}
 */
export function welch_anova_wasm(data, group_sizes, alpha) {
  const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passArray32ToWasm0(group_sizes, wasm.__wbindgen_malloc);
  const len1 = WASM_VECTOR_LEN;
  const ret = wasm.welch_anova_wasm(ptr0, len0, ptr1, len1, alpha);
  return WelchAnovaTestResult.__wrap(ret);
}

/**
 * WASM export for chi-square test of independence
 * @param {Float64Array} observed
 * @param {number} rows
 * @param {number} cols
 * @param {number} alpha
 * @returns {ChiSquareIndependenceTestResult}
 */
export function chi_square_independence(observed, rows, cols, alpha) {
  const ptr0 = passArrayF64ToWasm0(observed, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ret = wasm.chi_square_independence(ptr0, len0, rows, cols, alpha);
  return ChiSquareIndependenceTestResult.__wrap(ret);
}

/**
 * WASM export for chi-square goodness of fit test
 * @param {Float64Array} observed
 * @param {Float64Array} expected
 * @param {number} alpha
 * @returns {ChiSquareGoodnessOfFitTestResult}
 */
export function chi_square_goodness_of_fit(observed, expected, alpha) {
  const ptr0 = passArrayF64ToWasm0(observed, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passArrayF64ToWasm0(expected, wasm.__wbindgen_malloc);
  const len1 = WASM_VECTOR_LEN;
  const ret = wasm.chi_square_goodness_of_fit(ptr0, len0, ptr1, len1, alpha);
  return ChiSquareGoodnessOfFitTestResult.__wrap(ret);
}

/**
 * WASM export for chi-square test for variance
 * @param {Float64Array} data
 * @param {number} pop_variance
 * @param {string} tail
 * @param {number} alpha
 * @returns {ChiSquareVarianceTestResult}
 */
export function chi_square_variance(data, pop_variance, tail, alpha) {
  const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passStringToWasm0(
    tail,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len1 = WASM_VECTOR_LEN;
  const ret = wasm.chi_square_variance(
    ptr0,
    len0,
    pop_variance,
    ptr1,
    len1,
    alpha,
  );
  return ChiSquareVarianceTestResult.__wrap(ret);
}

/**
 * WASM export for chi-square sample size calculation
 * @param {number} effect_size
 * @param {number} alpha
 * @param {number} power
 * @param {number} _df
 * @returns {number}
 */
export function chi_square_sample_size_wasm(effect_size, alpha, power, _df) {
  const ret = wasm.chi_square_sample_size_wasm(effect_size, alpha, power, _df);
  return ret;
}

/**
 * @param {Float64Array} x
 * @param {Float64Array} y
 * @param {string} alternative
 * @param {number} alpha
 * @returns {PearsonCorrelationTestResult}
 */
export function pearson_correlation_test(x, y, alternative, alpha) {
  const ptr0 = passArrayF64ToWasm0(x, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passArrayF64ToWasm0(y, wasm.__wbindgen_malloc);
  const len1 = WASM_VECTOR_LEN;
  const ptr2 = passStringToWasm0(
    alternative,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len2 = WASM_VECTOR_LEN;
  const ret = wasm.pearson_correlation_test(
    ptr0,
    len0,
    ptr1,
    len1,
    ptr2,
    len2,
    alpha,
  );
  return PearsonCorrelationTestResult.__wrap(ret);
}

/**
 * @param {Float64Array} x
 * @param {Float64Array} y
 * @param {string} alternative
 * @param {number} alpha
 * @returns {SpearmanCorrelationTestResult}
 */
export function spearman_correlation_test(x, y, alternative, alpha) {
  const ptr0 = passArrayF64ToWasm0(x, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passArrayF64ToWasm0(y, wasm.__wbindgen_malloc);
  const len1 = WASM_VECTOR_LEN;
  const ptr2 = passStringToWasm0(
    alternative,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len2 = WASM_VECTOR_LEN;
  const ret = wasm.spearman_correlation_test(
    ptr0,
    len0,
    ptr1,
    len1,
    ptr2,
    len2,
    alpha,
  );
  return SpearmanCorrelationTestResult.__wrap(ret);
}

/**
 * @param {Float64Array} x
 * @param {Float64Array} y
 * @param {string} alternative
 * @param {number} alpha
 * @returns {KendallCorrelationTestResult}
 */
export function kendall_correlation_test(x, y, alternative, alpha) {
  const ptr0 = passArrayF64ToWasm0(x, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passArrayF64ToWasm0(y, wasm.__wbindgen_malloc);
  const len1 = WASM_VECTOR_LEN;
  const ptr2 = passStringToWasm0(
    alternative,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len2 = WASM_VECTOR_LEN;
  const ret = wasm.kendall_correlation_test(
    ptr0,
    len0,
    ptr1,
    len1,
    ptr2,
    len2,
    alpha,
  );
  return KendallCorrelationTestResult.__wrap(ret);
}

/**
 * WASM export for Fisher's exact test
 * @param {number} a
 * @param {number} b
 * @param {number} c
 * @param {number} d
 * @param {string} alternative
 * @param {number} odds_ratio
 * @param {number} alpha
 * @returns {FishersExactTestResult}
 */
export function fishers_exact_test_wasm(
  a,
  b,
  c,
  d,
  alternative,
  odds_ratio,
  alpha,
) {
  const ptr0 = passStringToWasm0(
    alternative,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len0 = WASM_VECTOR_LEN;
  const ret = wasm.fishers_exact_test_wasm(
    a,
    b,
    c,
    d,
    ptr0,
    len0,
    odds_ratio,
    alpha,
  );
  return FishersExactTestResult.__wrap(ret);
}

/**
 * WASM export for two-sample Kolmogorov-Smirnov test
 * @param {Float64Array} x
 * @param {Float64Array} y
 * @param {string} alternative
 * @param {number} alpha
 * @returns {KolmogorovSmirnovTestResult}
 */
export function kolmogorov_smirnov_test_wasm(x, y, alternative, alpha) {
  const ptr0 = passArrayF64ToWasm0(x, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passArrayF64ToWasm0(y, wasm.__wbindgen_malloc);
  const len1 = WASM_VECTOR_LEN;
  const ptr2 = passStringToWasm0(
    alternative,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len2 = WASM_VECTOR_LEN;
  const ret = wasm.kolmogorov_smirnov_test_wasm(
    ptr0,
    len0,
    ptr1,
    len1,
    ptr2,
    len2,
    alpha,
  );
  return KolmogorovSmirnovTestResult.__wrap(ret);
}

/**
 * WASM export for one-sample Kolmogorov-Smirnov test against uniform distribution
 * @param {Float64Array} x
 * @param {number} min
 * @param {number} max
 * @param {string} alternative
 * @param {number} alpha
 * @returns {KolmogorovSmirnovTestResult}
 */
export function kolmogorov_smirnov_uniform_wasm(
  x,
  min,
  max,
  alternative,
  alpha,
) {
  const ptr0 = passArrayF64ToWasm0(x, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passStringToWasm0(
    alternative,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len1 = WASM_VECTOR_LEN;
  const ret = wasm.kolmogorov_smirnov_uniform_wasm(
    ptr0,
    len0,
    min,
    max,
    ptr1,
    len1,
    alpha,
  );
  return KolmogorovSmirnovTestResult.__wrap(ret);
}

/**
 * WASM export for Kruskal-Wallis test
 * @param {Float64Array} data
 * @param {Uint32Array} group_sizes
 * @param {number} alpha
 * @returns {KruskalWallisTestResult}
 */
export function kruskal_wallis_test_wasm(data, group_sizes, alpha) {
  const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passArray32ToWasm0(group_sizes, wasm.__wbindgen_malloc);
  const len1 = WASM_VECTOR_LEN;
  const ret = wasm.kruskal_wallis_test_wasm(ptr0, len0, ptr1, len1, alpha);
  return KruskalWallisTestResult.__wrap(ret);
}

/**
 * WASM wrapper for Levene's test for equality of variances
 *
 * Tests whether groups have equal variances using the Brown-Forsythe
 * modification (deviations from medians rather than means).
 *
 * # Arguments
 * * `data` - Flattened array of all group data
 * * `group_sizes` - Array of group sizes
 * * `alpha` - Significance level
 *
 * # Returns
 * * `OneWayAnovaTestResult` - F-statistic, p-value, degrees of freedom
 *   - p < alpha indicates unequal variances (reject null hypothesis)
 *   - p >= alpha suggests equal variances (fail to reject null hypothesis)
 * @param {Float64Array} data
 * @param {Uint32Array} group_sizes
 * @param {number} alpha
 * @returns {OneWayAnovaTestResult}
 */
export function levene_test_wasm(data, group_sizes, alpha) {
  const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passArray32ToWasm0(group_sizes, wasm.__wbindgen_malloc);
  const len1 = WASM_VECTOR_LEN;
  const ret = wasm.levene_test_wasm(ptr0, len0, ptr1, len1, alpha);
  return OneWayAnovaTestResult.__wrap(ret);
}

/**
 * WASM export for Mann-Whitney U test (automatically chooses exact vs asymptotic)
 * @param {Float64Array} x
 * @param {Float64Array} y
 * @param {number} alpha
 * @param {string} alternative
 * @returns {MannWhitneyTestResult}
 */
export function mann_whitney_test(x, y, alpha, alternative) {
  const ptr0 = passArrayF64ToWasm0(x, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passArrayF64ToWasm0(y, wasm.__wbindgen_malloc);
  const len1 = WASM_VECTOR_LEN;
  const ptr2 = passStringToWasm0(
    alternative,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len2 = WASM_VECTOR_LEN;
  const ret = wasm.mann_whitney_test(ptr0, len0, ptr1, len1, alpha, ptr2, len2);
  return MannWhitneyTestResult.__wrap(ret);
}

/**
 * WASM export for Mann-Whitney U test with configuration
 * @param {Float64Array} x
 * @param {Float64Array} y
 * @param {boolean} exact
 * @param {boolean} continuity_correction
 * @param {number} alpha
 * @param {string} alternative
 * @returns {MannWhitneyTestResult}
 */
export function mann_whitney_test_with_config(
  x,
  y,
  exact,
  continuity_correction,
  alpha,
  alternative,
) {
  const ptr0 = passArrayF64ToWasm0(x, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passArrayF64ToWasm0(y, wasm.__wbindgen_malloc);
  const len1 = WASM_VECTOR_LEN;
  const ptr2 = passStringToWasm0(
    alternative,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len2 = WASM_VECTOR_LEN;
  const ret = wasm.mann_whitney_test_with_config(
    ptr0,
    len0,
    ptr1,
    len1,
    exact,
    continuity_correction,
    alpha,
    ptr2,
    len2,
  );
  return MannWhitneyTestResult.__wrap(ret);
}

/**
 * WASM export for Tukey HSD test
 * @param {Float64Array} data
 * @param {Uint32Array} group_sizes
 * @param {number} alpha
 * @returns {TukeyHsdTestResult}
 */
export function tukey_hsd_wasm(data, group_sizes, alpha) {
  const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passArray32ToWasm0(group_sizes, wasm.__wbindgen_malloc);
  const len1 = WASM_VECTOR_LEN;
  const ret = wasm.tukey_hsd_wasm(ptr0, len0, ptr1, len1, alpha);
  return TukeyHsdTestResult.__wrap(ret);
}

/**
 * WASM export for Games-Howell test
 * @param {Float64Array} data
 * @param {Uint32Array} group_sizes
 * @param {number} alpha
 * @returns {GamesHowellTestResult}
 */
export function games_howell_wasm(data, group_sizes, alpha) {
  const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passArray32ToWasm0(group_sizes, wasm.__wbindgen_malloc);
  const len1 = WASM_VECTOR_LEN;
  const ret = wasm.games_howell_wasm(ptr0, len0, ptr1, len1, alpha);
  return GamesHowellTestResult.__wrap(ret);
}

/**
 * WASM export for Dunn's test
 * @param {Float64Array} data
 * @param {Uint32Array} group_sizes
 * @param {number} alpha
 * @returns {DunnTestResult}
 */
export function dunn_test_wasm(data, group_sizes, alpha) {
  const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passArray32ToWasm0(group_sizes, wasm.__wbindgen_malloc);
  const len1 = WASM_VECTOR_LEN;
  const ret = wasm.dunn_test_wasm(ptr0, len0, ptr1, len1, alpha);
  return DunnTestResult.__wrap(ret);
}

/**
 * WASM export for one-sample proportion test (chi-square approach, matches R)
 * @param {number} x
 * @param {number} n
 * @param {number} p0
 * @param {number} alpha
 * @param {string} alternative
 * @returns {OneSampleProportionTestResult}
 */
export function proportion_test_one_sample(x, n, p0, alpha, alternative) {
  const ptr0 = passStringToWasm0(
    alternative,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len0 = WASM_VECTOR_LEN;
  const ret = wasm.proportion_test_one_sample(x, n, p0, alpha, ptr0, len0);
  return OneSampleProportionTestResult.__wrap(ret);
}

/**
 * WASM export for two-sample proportion test (chi-square approach, matches R)
 * @param {number} x1
 * @param {number} n1
 * @param {number} x2
 * @param {number} n2
 * @param {number} alpha
 * @param {string} alternative
 * @param {boolean} _pooled
 * @returns {TwoSampleProportionTestResult}
 */
export function proportion_test_two_sample(
  x1,
  n1,
  x2,
  n2,
  alpha,
  alternative,
  _pooled,
) {
  const ptr0 = passStringToWasm0(
    alternative,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len0 = WASM_VECTOR_LEN;
  const ret = wasm.proportion_test_two_sample(
    x1,
    n1,
    x2,
    n2,
    alpha,
    ptr0,
    len0,
    _pooled,
  );
  return TwoSampleProportionTestResult.__wrap(ret);
}

/**
 * WASM export for proportion sample size calculation
 * @param {number} p1
 * @param {number} p2
 * @param {number} alpha
 * @param {number} power
 * @returns {number}
 */
export function proportion_sample_size_wasm(p1, p2, alpha, power) {
  const ret = wasm.proportion_sample_size_wasm(p1, p2, alpha, power);
  return ret;
}

/**
 * WASM export for Shapiro-Wilk normality test
 * @param {Float64Array} x
 * @param {number} alpha
 * @returns {ShapiroWilkTestResult}
 */
export function shapiro_wilk_test(x, alpha) {
  const ptr0 = passArrayF64ToWasm0(x, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ret = wasm.shapiro_wilk_test(ptr0, len0, alpha);
  return ShapiroWilkTestResult.__wrap(ret);
}

/**
 * WASM export for one-sample t-test
 * @param {Float64Array} x
 * @param {number} mu
 * @param {number} alpha
 * @param {string} alternative
 * @returns {OneSampleTTestResult}
 */
export function t_test_one_sample(x, mu, alpha, alternative) {
  const ptr0 = passArrayF64ToWasm0(x, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passStringToWasm0(
    alternative,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len1 = WASM_VECTOR_LEN;
  const ret = wasm.t_test_one_sample(ptr0, len0, mu, alpha, ptr1, len1);
  return OneSampleTTestResult.__wrap(ret);
}

/**
 * WASM export for independent two-sample t-test
 * @param {Float64Array} x
 * @param {Float64Array} y
 * @param {number} alpha
 * @param {string} alternative
 * @param {boolean} pooled
 * @returns {TwoSampleTTestResult}
 */
export function t_test_two_sample_independent(
  x,
  y,
  alpha,
  alternative,
  pooled,
) {
  const ptr0 = passArrayF64ToWasm0(x, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passArrayF64ToWasm0(y, wasm.__wbindgen_malloc);
  const len1 = WASM_VECTOR_LEN;
  const ptr2 = passStringToWasm0(
    alternative,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len2 = WASM_VECTOR_LEN;
  const ret = wasm.t_test_two_sample_independent(
    ptr0,
    len0,
    ptr1,
    len1,
    alpha,
    ptr2,
    len2,
    pooled,
  );
  return TwoSampleTTestResult.__wrap(ret);
}

/**
 * WASM export for paired t-test
 * @param {Float64Array} x
 * @param {Float64Array} y
 * @param {number} alpha
 * @param {string} alternative
 * @returns {PairedTTestResult}
 */
export function t_test_paired(x, y, alpha, alternative) {
  const ptr0 = passArrayF64ToWasm0(x, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passArrayF64ToWasm0(y, wasm.__wbindgen_malloc);
  const len1 = WASM_VECTOR_LEN;
  const ptr2 = passStringToWasm0(
    alternative,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len2 = WASM_VECTOR_LEN;
  const ret = wasm.t_test_paired(ptr0, len0, ptr1, len1, alpha, ptr2, len2);
  return PairedTTestResult.__wrap(ret);
}

/**
 * WASM export for t-test sample size calculation
 * @param {number} effect_size
 * @param {number} alpha
 * @param {number} power
 * @param {number} std_dev
 * @returns {number}
 */
export function t_sample_size_wasm(effect_size, alpha, power, std_dev) {
  const ret = wasm.t_sample_size_wasm(effect_size, alpha, power, std_dev);
  return ret;
}

/**
 * WASM export for Wilcoxon W test (paired)
 * @param {Float64Array} x
 * @param {Float64Array} y
 * @param {number} alpha
 * @param {string} alternative
 * @returns {WilcoxonSignedRankTestResult}
 */
export function wilcoxon_w_test(x, y, alpha, alternative) {
  const ptr0 = passArrayF64ToWasm0(x, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passArrayF64ToWasm0(y, wasm.__wbindgen_malloc);
  const len1 = WASM_VECTOR_LEN;
  const ptr2 = passStringToWasm0(
    alternative,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len2 = WASM_VECTOR_LEN;
  const ret = wasm.wilcoxon_w_test(ptr0, len0, ptr1, len1, alpha, ptr2, len2);
  return WilcoxonSignedRankTestResult.__wrap(ret);
}

/**
 * WASM export for one-sample z-test
 * @param {Float64Array} x
 * @param {number} mu
 * @param {number} sigma
 * @param {number} alpha
 * @param {string} alternative
 * @returns {OneSampleZTestResult}
 */
export function z_test_one_sample(x, mu, sigma, alpha, alternative) {
  const ptr0 = passArrayF64ToWasm0(x, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passStringToWasm0(
    alternative,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len1 = WASM_VECTOR_LEN;
  const ret = wasm.z_test_one_sample(ptr0, len0, mu, sigma, alpha, ptr1, len1);
  return OneSampleZTestResult.__wrap(ret);
}

/**
 * WASM export for two-sample z-test
 * @param {Float64Array} x
 * @param {Float64Array} y
 * @param {number} sigma_x
 * @param {number} sigma_y
 * @param {number} alpha
 * @param {string} alternative
 * @returns {TwoSampleZTestResult}
 */
export function z_test_two_sample(x, y, sigma_x, sigma_y, alpha, alternative) {
  const ptr0 = passArrayF64ToWasm0(x, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passArrayF64ToWasm0(y, wasm.__wbindgen_malloc);
  const len1 = WASM_VECTOR_LEN;
  const ptr2 = passStringToWasm0(
    alternative,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len2 = WASM_VECTOR_LEN;
  const ret = wasm.z_test_two_sample(
    ptr0,
    len0,
    ptr1,
    len1,
    sigma_x,
    sigma_y,
    alpha,
    ptr2,
    len2,
  );
  return TwoSampleZTestResult.__wrap(ret);
}

/**
 * WASM export for z-test sample size calculation
 * @param {number} effect_size
 * @param {number} alpha
 * @param {number} power
 * @param {string} test_type
 * @returns {number}
 */
export function z_sample_size_wasm(effect_size, alpha, power, test_type) {
  const ptr0 = passStringToWasm0(
    test_type,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len0 = WASM_VECTOR_LEN;
  const ret = wasm.z_sample_size_wasm(effect_size, alpha, power, ptr0, len0);
  return ret;
}

/**
 * @returns {number}
 */
export function wasm_test() {
  const ret = wasm.wasm_test();
  return ret;
}

/**
 * Represents the type of alternative hypothesis for statistical tests.
 * @enum {0 | 1 | 2}
 */
export const AlternativeType = Object.freeze({
  /**
   * Two-sided test (default)
   */
  TwoSided: 0,
  "0": "TwoSided",
  /**
   * One-sided test: less than
   */
  Less: 1,
  "1": "Less",
  /**
   * One-sided test: greater than
   */
  Greater: 2,
  "2": "Greater",
});
/**
 * Effect size types that can be returned by statistical tests
 * @enum {0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18}
 */
export const EffectSizeType = Object.freeze({
  CohensD: 0,
  "0": "CohensD",
  HedgesG: 1,
  "1": "HedgesG",
  EtaSquared: 2,
  "2": "EtaSquared",
  PartialEtaSquared: 3,
  "3": "PartialEtaSquared",
  OmegaSquared: 4,
  "4": "OmegaSquared",
  CramersV: 5,
  "5": "CramersV",
  PhiCoefficient: 6,
  "6": "PhiCoefficient",
  PointBiserialCorrelation: 7,
  "7": "PointBiserialCorrelation",
  RankBiserialCorrelation: 8,
  "8": "RankBiserialCorrelation",
  KendallsTau: 9,
  "9": "KendallsTau",
  SpearmansRho: 10,
  "10": "SpearmansRho",
  PearsonsR: 11,
  "11": "PearsonsR",
  GlassDelta: 12,
  "12": "GlassDelta",
  CohensF: 13,
  "13": "CohensF",
  CohensH: 14,
  "14": "CohensH",
  OddsRatio: 15,
  "15": "OddsRatio",
  RelativeRisk: 16,
  "16": "RelativeRisk",
  RiskDifference: 17,
  "17": "RiskDifference",
  NumberNeededToTreat: 18,
  "18": "NumberNeededToTreat",
});
/**
 * Mann-Whitney test method type
 * @enum {0 | 1}
 */
export const MannWhitneyMethod = Object.freeze({
  Exact: 0,
  "0": "Exact",
  Asymptotic: 1,
  "1": "Asymptotic",
});
/**
 * Test statistic names that can be returned by statistical tests
 * @enum {0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18}
 */
export const TestStatisticName = Object.freeze({
  TStatistic: 0,
  "0": "TStatistic",
  FStatistic: 1,
  "1": "FStatistic",
  ChiSquare: 2,
  "2": "ChiSquare",
  ZStatistic: 3,
  "3": "ZStatistic",
  UStatistic: 4,
  "4": "UStatistic",
  WStatistic: 5,
  "5": "WStatistic",
  HStatistic: 6,
  "6": "HStatistic",
  RStatistic: 7,
  "7": "RStatistic",
  TauStatistic: 8,
  "8": "TauStatistic",
  RhoStatistic: 9,
  "9": "RhoStatistic",
  DStatistic: 10,
  "10": "DStatistic",
  GStatistic: 11,
  "11": "GStatistic",
  QStatistic: 12,
  "12": "QStatistic",
  VStatistic: 13,
  "13": "VStatistic",
  AStatistic: 14,
  "14": "AStatistic",
  BStatistic: 15,
  "15": "BStatistic",
  LStatistic: 16,
  "16": "LStatistic",
  SStatistic: 17,
  "17": "SStatistic",
  ExactTest: 18,
  "18": "ExactTest",
});
/**
 * Represents the type of statistical test performed.
 * @enum {0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20}
 */
export const TestType = Object.freeze({
  OneWayAnova: 0,
  "0": "OneWayAnova",
  TwoWayAnovaFactorA: 1,
  "1": "TwoWayAnovaFactorA",
  TwoWayAnovaFactorB: 2,
  "2": "TwoWayAnovaFactorB",
  TwoWayAnovaInteraction: 3,
  "3": "TwoWayAnovaInteraction",
  IndependentTTest: 4,
  "4": "IndependentTTest",
  PairedTTest: 5,
  "5": "PairedTTest",
  OneSampleTTest: 6,
  "6": "OneSampleTTest",
  ChiSquareIndependence: 7,
  "7": "ChiSquareIndependence",
  MannWhitneyU: 8,
  "8": "MannWhitneyU",
  WilcoxonSignedRank: 9,
  "9": "WilcoxonSignedRank",
  KruskalWallis: 10,
  "10": "KruskalWallis",
  OneSampleZTest: 11,
  "11": "OneSampleZTest",
  TwoSampleZTest: 12,
  "12": "TwoSampleZTest",
  OneSampleProportionTest: 13,
  "13": "OneSampleProportionTest",
  TwoSampleProportionTest: 14,
  "14": "TwoSampleProportionTest",
  ShapiroWilk: 15,
  "15": "ShapiroWilk",
  FishersExact: 16,
  "16": "FishersExact",
  PearsonCorrelation: 17,
  "17": "PearsonCorrelation",
  SpearmanCorrelation: 18,
  "18": "SpearmanCorrelation",
  KendallCorrelation: 19,
  "19": "KendallCorrelation",
  Error: 20,
  "20": "Error",
});
/**
 * Wilcoxon signed-rank test method type
 * @enum {0 | 1}
 */
export const WilcoxonMethod = Object.freeze({
  Exact: 0,
  "0": "Exact",
  Asymptotic: 1,
  "1": "Asymptotic",
});

const AnovaTableComponentFinalization =
  (typeof FinalizationRegistry === "undefined")
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry((ptr) =>
      wasm.__wbg_anovatablecomponent_free(ptr >>> 0, 1)
    );
/**
 * Complete ANOVA table component (includes Total row)
 */
export class AnovaTableComponent {
  static __wrap(ptr) {
    ptr = ptr >>> 0;
    const obj = Object.create(AnovaTableComponent.prototype);
    obj.__wbg_ptr = ptr;
    AnovaTableComponentFinalization.register(obj, obj.__wbg_ptr, obj);
    return obj;
  }

  static __unwrap(jsValue) {
    if (!(jsValue instanceof AnovaTableComponent)) {
      return 0;
    }
    return jsValue.__destroy_into_raw();
  }

  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    AnovaTableComponentFinalization.unregister(this);
    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_anovatablecomponent_free(ptr, 0);
  }
  /**
   * @returns {string}
   */
  get component() {
    let deferred1_0;
    let deferred1_1;
    try {
      const ret = wasm.__wbg_get_anovatablecomponent_component(this.__wbg_ptr);
      deferred1_0 = ret[0];
      deferred1_1 = ret[1];
      return getStringFromWasm0(ret[0], ret[1]);
    } finally {
      wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
  }
  /**
   * @param {string} arg0
   */
  set component(arg0) {
    const ptr0 = passStringToWasm0(
      arg0,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_anovatablecomponent_component(this.__wbg_ptr, ptr0, len0);
  }
  /**
   * @returns {number}
   */
  get ss() {
    const ret = wasm.__wbg_get_anovatablecomponent_ss(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set ss(arg0) {
    wasm.__wbg_set_anovatablecomponent_ss(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {number}
   */
  get df() {
    const ret = wasm.__wbg_get_anovatablecomponent_df(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set df(arg0) {
    wasm.__wbg_set_anovatablecomponent_df(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {number | undefined}
   */
  get ms() {
    const ret = wasm.__wbg_get_anovatablecomponent_ms(this.__wbg_ptr);
    return ret[0] === 0 ? undefined : ret[1];
  }
  /**
   * @param {number | null} [arg0]
   */
  set ms(arg0) {
    wasm.__wbg_set_anovatablecomponent_ms(
      this.__wbg_ptr,
      !isLikeNone(arg0),
      isLikeNone(arg0) ? 0 : arg0,
    );
  }
  /**
   * @returns {number | undefined}
   */
  get f_statistic() {
    const ret = wasm.__wbg_get_anovatablecomponent_f_statistic(this.__wbg_ptr);
    return ret[0] === 0 ? undefined : ret[1];
  }
  /**
   * @param {number | null} [arg0]
   */
  set f_statistic(arg0) {
    wasm.__wbg_set_anovatablecomponent_f_statistic(
      this.__wbg_ptr,
      !isLikeNone(arg0),
      isLikeNone(arg0) ? 0 : arg0,
    );
  }
  /**
   * @returns {number | undefined}
   */
  get p_value() {
    const ret = wasm.__wbg_get_anovatablecomponent_p_value(this.__wbg_ptr);
    return ret[0] === 0 ? undefined : ret[1];
  }
  /**
   * @param {number | null} [arg0]
   */
  set p_value(arg0) {
    wasm.__wbg_set_anovatablecomponent_p_value(
      this.__wbg_ptr,
      !isLikeNone(arg0),
      isLikeNone(arg0) ? 0 : arg0,
    );
  }
  /**
   * @returns {number | undefined}
   */
  get eta_squared() {
    const ret = wasm.__wbg_get_anovatablecomponent_eta_squared(this.__wbg_ptr);
    return ret[0] === 0 ? undefined : ret[1];
  }
  /**
   * @param {number | null} [arg0]
   */
  set eta_squared(arg0) {
    wasm.__wbg_set_anovatablecomponent_eta_squared(
      this.__wbg_ptr,
      !isLikeNone(arg0),
      isLikeNone(arg0) ? 0 : arg0,
    );
  }
  /**
   * @returns {number | undefined}
   */
  get partial_eta_squared() {
    const ret = wasm.__wbg_get_anovatablecomponent_partial_eta_squared(
      this.__wbg_ptr,
    );
    return ret[0] === 0 ? undefined : ret[1];
  }
  /**
   * @param {number | null} [arg0]
   */
  set partial_eta_squared(arg0) {
    wasm.__wbg_set_anovatablecomponent_partial_eta_squared(
      this.__wbg_ptr,
      !isLikeNone(arg0),
      isLikeNone(arg0) ? 0 : arg0,
    );
  }
  /**
   * @returns {number | undefined}
   */
  get omega_squared() {
    const ret = wasm.__wbg_get_anovatablecomponent_omega_squared(
      this.__wbg_ptr,
    );
    return ret[0] === 0 ? undefined : ret[1];
  }
  /**
   * @param {number | null} [arg0]
   */
  set omega_squared(arg0) {
    wasm.__wbg_set_anovatablecomponent_omega_squared(
      this.__wbg_ptr,
      !isLikeNone(arg0),
      isLikeNone(arg0) ? 0 : arg0,
    );
  }
}

const AnovaTestComponentFinalization =
  (typeof FinalizationRegistry === "undefined")
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry((ptr) =>
      wasm.__wbg_anovatestcomponent_free(ptr >>> 0, 1)
    );
/**
 * Component of a two-way ANOVA test (Factor A, Factor B, or Interaction)
 */
export class AnovaTestComponent {
  static __wrap(ptr) {
    ptr = ptr >>> 0;
    const obj = Object.create(AnovaTestComponent.prototype);
    obj.__wbg_ptr = ptr;
    AnovaTestComponentFinalization.register(obj, obj.__wbg_ptr, obj);
    return obj;
  }

  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    AnovaTestComponentFinalization.unregister(this);
    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_anovatestcomponent_free(ptr, 0);
  }
  /**
   * @returns {TestStatistic}
   */
  get test_statistic() {
    const ret = wasm.__wbg_get_anovatestcomponent_test_statistic(
      this.__wbg_ptr,
    );
    return TestStatistic.__wrap(ret);
  }
  /**
   * @param {TestStatistic} arg0
   */
  set test_statistic(arg0) {
    _assertClass(arg0, TestStatistic);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_anovatestcomponent_test_statistic(this.__wbg_ptr, ptr0);
  }
  /**
   * @returns {number}
   */
  get p_value() {
    const ret = wasm.__wbg_get_anovatestcomponent_p_value(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set p_value(arg0) {
    wasm.__wbg_set_anovatestcomponent_p_value(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {number}
   */
  get degrees_of_freedom() {
    const ret = wasm.__wbg_get_anovatestcomponent_degrees_of_freedom(
      this.__wbg_ptr,
    );
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set degrees_of_freedom(arg0) {
    wasm.__wbg_set_anovatestcomponent_degrees_of_freedom(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {EffectSize}
   */
  get effect_size() {
    const ret = wasm.__wbg_get_anovatestcomponent_effect_size(this.__wbg_ptr);
    return EffectSize.__wrap(ret);
  }
  /**
   * @param {EffectSize} arg0
   */
  set effect_size(arg0) {
    _assertClass(arg0, EffectSize);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_anovatestcomponent_effect_size(this.__wbg_ptr, ptr0);
  }
  /**
   * @returns {number}
   */
  get mean_square() {
    const ret = wasm.__wbg_get_anovatestcomponent_mean_square(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set mean_square(arg0) {
    wasm.__wbg_set_anovatestcomponent_mean_square(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {number}
   */
  get sum_of_squares() {
    const ret = wasm.__wbg_get_anovatestcomponent_sum_of_squares(
      this.__wbg_ptr,
    );
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set sum_of_squares(arg0) {
    wasm.__wbg_set_anovatestcomponent_sum_of_squares(this.__wbg_ptr, arg0);
  }
}

const ChiSquareGoodnessOfFitTestResultFinalization =
  (typeof FinalizationRegistry === "undefined")
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry((ptr) =>
      wasm.__wbg_chisquaregoodnessoffittestresult_free(ptr >>> 0, 1)
    );
/**
 * Chi-square goodness of fit test result
 */
export class ChiSquareGoodnessOfFitTestResult {
  static __wrap(ptr) {
    ptr = ptr >>> 0;
    const obj = Object.create(ChiSquareGoodnessOfFitTestResult.prototype);
    obj.__wbg_ptr = ptr;
    ChiSquareGoodnessOfFitTestResultFinalization.register(
      obj,
      obj.__wbg_ptr,
      obj,
    );
    return obj;
  }

  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    ChiSquareGoodnessOfFitTestResultFinalization.unregister(this);
    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_chisquaregoodnessoffittestresult_free(ptr, 0);
  }
  /**
   * @returns {TestStatistic}
   */
  get test_statistic() {
    const ret = wasm.__wbg_get_anovatestcomponent_test_statistic(
      this.__wbg_ptr,
    );
    return TestStatistic.__wrap(ret);
  }
  /**
   * @param {TestStatistic} arg0
   */
  set test_statistic(arg0) {
    _assertClass(arg0, TestStatistic);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_anovatestcomponent_test_statistic(this.__wbg_ptr, ptr0);
  }
  /**
   * @returns {number}
   */
  get p_value() {
    const ret = wasm.__wbg_get_anovatestcomponent_p_value(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set p_value(arg0) {
    wasm.__wbg_set_anovatestcomponent_p_value(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {string}
   */
  get test_name() {
    let deferred1_0;
    let deferred1_1;
    try {
      const ret = wasm.__wbg_get_chisquaregoodnessoffittestresult_test_name(
        this.__wbg_ptr,
      );
      deferred1_0 = ret[0];
      deferred1_1 = ret[1];
      return getStringFromWasm0(ret[0], ret[1]);
    } finally {
      wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
  }
  /**
   * @param {string} arg0
   */
  set test_name(arg0) {
    const ptr0 = passStringToWasm0(
      arg0,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_chisquaregoodnessoffittestresult_test_name(
      this.__wbg_ptr,
      ptr0,
      len0,
    );
  }
  /**
   * @returns {number}
   */
  get alpha() {
    const ret = wasm.__wbg_get_anovatestcomponent_degrees_of_freedom(
      this.__wbg_ptr,
    );
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set alpha(arg0) {
    wasm.__wbg_set_anovatestcomponent_degrees_of_freedom(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {string | undefined}
   */
  get error_message() {
    const ret = wasm.__wbg_get_chisquaregoodnessoffittestresult_error_message(
      this.__wbg_ptr,
    );
    let v1;
    if (ret[0] !== 0) {
      v1 = getStringFromWasm0(ret[0], ret[1]).slice();
      wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    }
    return v1;
  }
  /**
   * @param {string | null} [arg0]
   */
  set error_message(arg0) {
    var ptr0 = isLikeNone(arg0)
      ? 0
      : passStringToWasm0(
        arg0,
        wasm.__wbindgen_malloc,
        wasm.__wbindgen_realloc,
      );
    var len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_chisquaregoodnessoffittestresult_error_message(
      this.__wbg_ptr,
      ptr0,
      len0,
    );
  }
  /**
   * @returns {number}
   */
  get degrees_of_freedom() {
    const ret = wasm.__wbg_get_anovatestcomponent_mean_square(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set degrees_of_freedom(arg0) {
    wasm.__wbg_set_anovatestcomponent_mean_square(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {EffectSize}
   */
  get effect_size() {
    const ret = wasm.__wbg_get_anovatestcomponent_effect_size(this.__wbg_ptr);
    return EffectSize.__wrap(ret);
  }
  /**
   * @param {EffectSize} arg0
   */
  set effect_size(arg0) {
    _assertClass(arg0, EffectSize);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_anovatestcomponent_effect_size(this.__wbg_ptr, ptr0);
  }
  /**
   * @returns {number}
   */
  get sample_size() {
    const ret = wasm.__wbg_get_chisquaregoodnessoffittestresult_sample_size(
      this.__wbg_ptr,
    );
    return ret >>> 0;
  }
  /**
   * @param {number} arg0
   */
  set sample_size(arg0) {
    wasm.__wbg_set_chisquaregoodnessoffittestresult_sample_size(
      this.__wbg_ptr,
      arg0,
    );
  }
  /**
   * @returns {Float64Array}
   */
  get chi_square_expected() {
    const ret = wasm
      .__wbg_get_chisquaregoodnessoffittestresult_chi_square_expected(
        this.__wbg_ptr,
      );
    var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v1;
  }
  /**
   * @param {Float64Array} arg0
   */
  set chi_square_expected(arg0) {
    const ptr0 = passArrayF64ToWasm0(arg0, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_chisquaregoodnessoffittestresult_chi_square_expected(
      this.__wbg_ptr,
      ptr0,
      len0,
    );
  }
}

const ChiSquareIndependenceTestResultFinalization =
  (typeof FinalizationRegistry === "undefined")
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry((ptr) =>
      wasm.__wbg_chisquareindependencetestresult_free(ptr >>> 0, 1)
    );
/**
 * Chi-square test of independence result
 */
export class ChiSquareIndependenceTestResult {
  static __wrap(ptr) {
    ptr = ptr >>> 0;
    const obj = Object.create(ChiSquareIndependenceTestResult.prototype);
    obj.__wbg_ptr = ptr;
    ChiSquareIndependenceTestResultFinalization.register(
      obj,
      obj.__wbg_ptr,
      obj,
    );
    return obj;
  }

  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    ChiSquareIndependenceTestResultFinalization.unregister(this);
    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_chisquareindependencetestresult_free(ptr, 0);
  }
  /**
   * @returns {TestStatistic}
   */
  get test_statistic() {
    const ret = wasm.__wbg_get_anovatestcomponent_test_statistic(
      this.__wbg_ptr,
    );
    return TestStatistic.__wrap(ret);
  }
  /**
   * @param {TestStatistic} arg0
   */
  set test_statistic(arg0) {
    _assertClass(arg0, TestStatistic);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_anovatestcomponent_test_statistic(this.__wbg_ptr, ptr0);
  }
  /**
   * @returns {number}
   */
  get p_value() {
    const ret = wasm.__wbg_get_anovatestcomponent_p_value(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set p_value(arg0) {
    wasm.__wbg_set_anovatestcomponent_p_value(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {string}
   */
  get test_name() {
    let deferred1_0;
    let deferred1_1;
    try {
      const ret = wasm.__wbg_get_chisquareindependencetestresult_test_name(
        this.__wbg_ptr,
      );
      deferred1_0 = ret[0];
      deferred1_1 = ret[1];
      return getStringFromWasm0(ret[0], ret[1]);
    } finally {
      wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
  }
  /**
   * @param {string} arg0
   */
  set test_name(arg0) {
    const ptr0 = passStringToWasm0(
      arg0,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_chisquareindependencetestresult_test_name(
      this.__wbg_ptr,
      ptr0,
      len0,
    );
  }
  /**
   * @returns {number}
   */
  get alpha() {
    const ret = wasm.__wbg_get_anovatestcomponent_degrees_of_freedom(
      this.__wbg_ptr,
    );
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set alpha(arg0) {
    wasm.__wbg_set_anovatestcomponent_degrees_of_freedom(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {string | undefined}
   */
  get error_message() {
    const ret = wasm.__wbg_get_chisquareindependencetestresult_error_message(
      this.__wbg_ptr,
    );
    let v1;
    if (ret[0] !== 0) {
      v1 = getStringFromWasm0(ret[0], ret[1]).slice();
      wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    }
    return v1;
  }
  /**
   * @param {string | null} [arg0]
   */
  set error_message(arg0) {
    var ptr0 = isLikeNone(arg0)
      ? 0
      : passStringToWasm0(
        arg0,
        wasm.__wbindgen_malloc,
        wasm.__wbindgen_realloc,
      );
    var len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_chisquareindependencetestresult_error_message(
      this.__wbg_ptr,
      ptr0,
      len0,
    );
  }
  /**
   * @returns {number}
   */
  get degrees_of_freedom() {
    const ret = wasm.__wbg_get_anovatestcomponent_mean_square(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set degrees_of_freedom(arg0) {
    wasm.__wbg_set_anovatestcomponent_mean_square(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {EffectSize}
   */
  get effect_size() {
    const ret = wasm.__wbg_get_anovatestcomponent_effect_size(this.__wbg_ptr);
    return EffectSize.__wrap(ret);
  }
  /**
   * @param {EffectSize} arg0
   */
  set effect_size(arg0) {
    _assertClass(arg0, EffectSize);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_anovatestcomponent_effect_size(this.__wbg_ptr, ptr0);
  }
  /**
   * @returns {number}
   */
  get sample_size() {
    const ret = wasm.__wbg_get_chisquareindependencetestresult_sample_size(
      this.__wbg_ptr,
    );
    return ret >>> 0;
  }
  /**
   * @param {number} arg0
   */
  set sample_size(arg0) {
    wasm.__wbg_set_chisquareindependencetestresult_sample_size(
      this.__wbg_ptr,
      arg0,
    );
  }
  /**
   * @returns {number}
   */
  get phi_coefficient() {
    const ret = wasm.__wbg_get_anovatestcomponent_sum_of_squares(
      this.__wbg_ptr,
    );
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set phi_coefficient(arg0) {
    wasm.__wbg_set_anovatestcomponent_sum_of_squares(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {Float64Array}
   */
  get chi_square_expected() {
    const ret = wasm
      .__wbg_get_chisquareindependencetestresult_chi_square_expected(
        this.__wbg_ptr,
      );
    var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v1;
  }
  /**
   * @param {Float64Array} arg0
   */
  set chi_square_expected(arg0) {
    const ptr0 = passArrayF64ToWasm0(arg0, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_chisquareindependencetestresult_chi_square_expected(
      this.__wbg_ptr,
      ptr0,
      len0,
    );
  }
  /**
   * @returns {Float64Array}
   */
  get residuals() {
    const ret = wasm.__wbg_get_chisquareindependencetestresult_residuals(
      this.__wbg_ptr,
    );
    var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v1;
  }
  /**
   * @param {Float64Array} arg0
   */
  set residuals(arg0) {
    const ptr0 = passArrayF64ToWasm0(arg0, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_chisquareindependencetestresult_residuals(
      this.__wbg_ptr,
      ptr0,
      len0,
    );
  }
}

const ChiSquareVarianceTestResultFinalization =
  (typeof FinalizationRegistry === "undefined")
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry((ptr) =>
      wasm.__wbg_chisquarevariancetestresult_free(ptr >>> 0, 1)
    );
/**
 * Chi-square test for variance result
 */
export class ChiSquareVarianceTestResult {
  static __wrap(ptr) {
    ptr = ptr >>> 0;
    const obj = Object.create(ChiSquareVarianceTestResult.prototype);
    obj.__wbg_ptr = ptr;
    ChiSquareVarianceTestResultFinalization.register(obj, obj.__wbg_ptr, obj);
    return obj;
  }

  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    ChiSquareVarianceTestResultFinalization.unregister(this);
    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_chisquarevariancetestresult_free(ptr, 0);
  }
  /**
   * @returns {TestStatistic}
   */
  get test_statistic() {
    const ret = wasm.__wbg_get_anovatestcomponent_test_statistic(
      this.__wbg_ptr,
    );
    return TestStatistic.__wrap(ret);
  }
  /**
   * @param {TestStatistic} arg0
   */
  set test_statistic(arg0) {
    _assertClass(arg0, TestStatistic);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_anovatestcomponent_test_statistic(this.__wbg_ptr, ptr0);
  }
  /**
   * @returns {number}
   */
  get p_value() {
    const ret = wasm.__wbg_get_anovatestcomponent_p_value(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set p_value(arg0) {
    wasm.__wbg_set_anovatestcomponent_p_value(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {string}
   */
  get test_name() {
    let deferred1_0;
    let deferred1_1;
    try {
      const ret = wasm.__wbg_get_chisquarevariancetestresult_test_name(
        this.__wbg_ptr,
      );
      deferred1_0 = ret[0];
      deferred1_1 = ret[1];
      return getStringFromWasm0(ret[0], ret[1]);
    } finally {
      wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
  }
  /**
   * @param {string} arg0
   */
  set test_name(arg0) {
    const ptr0 = passStringToWasm0(
      arg0,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_chisquarevariancetestresult_test_name(
      this.__wbg_ptr,
      ptr0,
      len0,
    );
  }
  /**
   * @returns {number}
   */
  get alpha() {
    const ret = wasm.__wbg_get_anovatestcomponent_degrees_of_freedom(
      this.__wbg_ptr,
    );
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set alpha(arg0) {
    wasm.__wbg_set_anovatestcomponent_degrees_of_freedom(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {string | undefined}
   */
  get error_message() {
    const ret = wasm.__wbg_get_chisquarevariancetestresult_error_message(
      this.__wbg_ptr,
    );
    let v1;
    if (ret[0] !== 0) {
      v1 = getStringFromWasm0(ret[0], ret[1]).slice();
      wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    }
    return v1;
  }
  /**
   * @param {string | null} [arg0]
   */
  set error_message(arg0) {
    var ptr0 = isLikeNone(arg0)
      ? 0
      : passStringToWasm0(
        arg0,
        wasm.__wbindgen_malloc,
        wasm.__wbindgen_realloc,
      );
    var len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_chisquarevariancetestresult_error_message(
      this.__wbg_ptr,
      ptr0,
      len0,
    );
  }
  /**
   * @returns {number}
   */
  get degrees_of_freedom() {
    const ret = wasm.__wbg_get_anovatestcomponent_mean_square(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set degrees_of_freedom(arg0) {
    wasm.__wbg_set_anovatestcomponent_mean_square(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {EffectSize}
   */
  get effect_size() {
    const ret = wasm.__wbg_get_anovatestcomponent_effect_size(this.__wbg_ptr);
    return EffectSize.__wrap(ret);
  }
  /**
   * @param {EffectSize} arg0
   */
  set effect_size(arg0) {
    _assertClass(arg0, EffectSize);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_anovatestcomponent_effect_size(this.__wbg_ptr, ptr0);
  }
  /**
   * @returns {number}
   */
  get sample_size() {
    const ret = wasm.__wbg_get_chisquarevariancetestresult_sample_size(
      this.__wbg_ptr,
    );
    return ret >>> 0;
  }
  /**
   * @param {number} arg0
   */
  set sample_size(arg0) {
    wasm.__wbg_set_chisquarevariancetestresult_sample_size(
      this.__wbg_ptr,
      arg0,
    );
  }
  /**
   * @returns {ConfidenceInterval}
   */
  get confidence_interval() {
    const ret = wasm.__wbg_get_chisquarevariancetestresult_confidence_interval(
      this.__wbg_ptr,
    );
    return ConfidenceInterval.__wrap(ret);
  }
  /**
   * @param {ConfidenceInterval} arg0
   */
  set confidence_interval(arg0) {
    _assertClass(arg0, ConfidenceInterval);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_chisquarevariancetestresult_confidence_interval(
      this.__wbg_ptr,
      ptr0,
    );
  }
}

const ConfidenceIntervalFinalization =
  (typeof FinalizationRegistry === "undefined")
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry((ptr) =>
      wasm.__wbg_confidenceinterval_free(ptr >>> 0, 1)
    );
/**
 * Confidence interval structure
 */
export class ConfidenceInterval {
  static __wrap(ptr) {
    ptr = ptr >>> 0;
    const obj = Object.create(ConfidenceInterval.prototype);
    obj.__wbg_ptr = ptr;
    ConfidenceIntervalFinalization.register(obj, obj.__wbg_ptr, obj);
    return obj;
  }

  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    ConfidenceIntervalFinalization.unregister(this);
    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_confidenceinterval_free(ptr, 0);
  }
  /**
   * @returns {number}
   */
  get lower() {
    const ret = wasm.__wbg_get_confidenceinterval_lower(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set lower(arg0) {
    wasm.__wbg_set_confidenceinterval_lower(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {number}
   */
  get upper() {
    const ret = wasm.__wbg_get_confidenceinterval_upper(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set upper(arg0) {
    wasm.__wbg_set_confidenceinterval_upper(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {number}
   */
  get confidence_level() {
    const ret = wasm.__wbg_get_confidenceinterval_confidence_level(
      this.__wbg_ptr,
    );
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set confidence_level(arg0) {
    wasm.__wbg_set_confidenceinterval_confidence_level(this.__wbg_ptr, arg0);
  }
}

const DunnTestResultFinalization = (typeof FinalizationRegistry === "undefined")
  ? { register: () => {}, unregister: () => {} }
  : new FinalizationRegistry((ptr) =>
    wasm.__wbg_dunntestresult_free(ptr >>> 0, 1)
  );
/**
 * Result structure for Dunn's test
 */
export class DunnTestResult {
  static __wrap(ptr) {
    ptr = ptr >>> 0;
    const obj = Object.create(DunnTestResult.prototype);
    obj.__wbg_ptr = ptr;
    DunnTestResultFinalization.register(obj, obj.__wbg_ptr, obj);
    return obj;
  }

  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    DunnTestResultFinalization.unregister(this);
    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_dunntestresult_free(ptr, 0);
  }
  /**
   * Test statistic for the overall test (if applicable)
   * @returns {TestStatistic}
   */
  get test_statistic() {
    const ret = wasm.__wbg_get_anovatestcomponent_test_statistic(
      this.__wbg_ptr,
    );
    return TestStatistic.__wrap(ret);
  }
  /**
   * Test statistic for the overall test (if applicable)
   * @param {TestStatistic} arg0
   */
  set test_statistic(arg0) {
    _assertClass(arg0, TestStatistic);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_anovatestcomponent_test_statistic(this.__wbg_ptr, ptr0);
  }
  /**
   * P-value for the overall test (if applicable)
   * @returns {number}
   */
  get p_value() {
    const ret = wasm.__wbg_get_dunntestresult_p_value(this.__wbg_ptr);
    return ret;
  }
  /**
   * P-value for the overall test (if applicable)
   * @param {number} arg0
   */
  set p_value(arg0) {
    wasm.__wbg_set_dunntestresult_p_value(this.__wbg_ptr, arg0);
  }
  /**
   * Name of the test performed
   * @returns {string}
   */
  get test_name() {
    let deferred1_0;
    let deferred1_1;
    try {
      const ret = wasm.__wbg_get_dunntestresult_test_name(this.__wbg_ptr);
      deferred1_0 = ret[0];
      deferred1_1 = ret[1];
      return getStringFromWasm0(ret[0], ret[1]);
    } finally {
      wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
  }
  /**
   * Name of the test performed
   * @param {string} arg0
   */
  set test_name(arg0) {
    const ptr0 = passStringToWasm0(
      arg0,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_dunntestresult_test_name(this.__wbg_ptr, ptr0, len0);
  }
  /**
   * Significance level used
   * @returns {number}
   */
  get alpha() {
    const ret = wasm.__wbg_get_dunntestresult_alpha(this.__wbg_ptr);
    return ret;
  }
  /**
   * Significance level used
   * @param {number} arg0
   */
  set alpha(arg0) {
    wasm.__wbg_set_dunntestresult_alpha(this.__wbg_ptr, arg0);
  }
  /**
   * Error message if test failed
   * @returns {string | undefined}
   */
  get error_message() {
    const ret = wasm.__wbg_get_dunntestresult_error_message(this.__wbg_ptr);
    let v1;
    if (ret[0] !== 0) {
      v1 = getStringFromWasm0(ret[0], ret[1]).slice();
      wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    }
    return v1;
  }
  /**
   * Error message if test failed
   * @param {string | null} [arg0]
   */
  set error_message(arg0) {
    var ptr0 = isLikeNone(arg0)
      ? 0
      : passStringToWasm0(
        arg0,
        wasm.__wbindgen_malloc,
        wasm.__wbindgen_realloc,
      );
    var len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_dunntestresult_error_message(this.__wbg_ptr, ptr0, len0);
  }
  /**
   * Explanatory note about the header values
   * @returns {string | undefined}
   */
  get note() {
    const ret = wasm.__wbg_get_dunntestresult_note(this.__wbg_ptr);
    let v1;
    if (ret[0] !== 0) {
      v1 = getStringFromWasm0(ret[0], ret[1]).slice();
      wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    }
    return v1;
  }
  /**
   * Explanatory note about the header values
   * @param {string | null} [arg0]
   */
  set note(arg0) {
    var ptr0 = isLikeNone(arg0)
      ? 0
      : passStringToWasm0(
        arg0,
        wasm.__wbindgen_malloc,
        wasm.__wbindgen_realloc,
      );
    var len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_dunntestresult_note(this.__wbg_ptr, ptr0, len0);
  }
  /**
   * Multiple comparison correction method used
   * @returns {string}
   */
  get correction_method() {
    let deferred1_0;
    let deferred1_1;
    try {
      const ret = wasm.__wbg_get_dunntestresult_correction_method(
        this.__wbg_ptr,
      );
      deferred1_0 = ret[0];
      deferred1_1 = ret[1];
      return getStringFromWasm0(ret[0], ret[1]);
    } finally {
      wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
  }
  /**
   * Multiple comparison correction method used
   * @param {string} arg0
   */
  set correction_method(arg0) {
    const ptr0 = passStringToWasm0(
      arg0,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_dunntestresult_correction_method(this.__wbg_ptr, ptr0, len0);
  }
  /**
   * Number of groups compared
   * @returns {number}
   */
  get n_groups() {
    const ret = wasm.__wbg_get_dunntestresult_n_groups(this.__wbg_ptr);
    return ret >>> 0;
  }
  /**
   * Number of groups compared
   * @param {number} arg0
   */
  set n_groups(arg0) {
    wasm.__wbg_set_dunntestresult_n_groups(this.__wbg_ptr, arg0);
  }
  /**
   * Total sample size
   * @returns {number}
   */
  get n_total() {
    const ret = wasm.__wbg_get_dunntestresult_n_total(this.__wbg_ptr);
    return ret >>> 0;
  }
  /**
   * Total sample size
   * @param {number} arg0
   */
  set n_total(arg0) {
    wasm.__wbg_set_dunntestresult_n_total(this.__wbg_ptr, arg0);
  }
  /**
   * Individual pairwise comparisons
   * @returns {PairwiseComparison[]}
   */
  get comparisons() {
    const ret = wasm.__wbg_get_dunntestresult_comparisons(this.__wbg_ptr);
    var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
    return v1;
  }
  /**
   * Individual pairwise comparisons
   * @param {PairwiseComparison[]} arg0
   */
  set comparisons(arg0) {
    const ptr0 = passArrayJsValueToWasm0(arg0, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_dunntestresult_comparisons(this.__wbg_ptr, ptr0, len0);
  }
}

const EffectSizeFinalization = (typeof FinalizationRegistry === "undefined")
  ? { register: () => {}, unregister: () => {} }
  : new FinalizationRegistry((ptr) => wasm.__wbg_effectsize_free(ptr >>> 0, 1));
/**
 * Effect size with type information
 */
export class EffectSize {
  static __wrap(ptr) {
    ptr = ptr >>> 0;
    const obj = Object.create(EffectSize.prototype);
    obj.__wbg_ptr = ptr;
    EffectSizeFinalization.register(obj, obj.__wbg_ptr, obj);
    return obj;
  }

  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    EffectSizeFinalization.unregister(this);
    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_effectsize_free(ptr, 0);
  }
  /**
   * @returns {number}
   */
  get value() {
    const ret = wasm.__wbg_get_confidenceinterval_lower(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set value(arg0) {
    wasm.__wbg_set_confidenceinterval_lower(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {string}
   */
  get effect_type() {
    let deferred1_0;
    let deferred1_1;
    try {
      const ret = wasm.__wbg_get_effectsize_effect_type(this.__wbg_ptr);
      deferred1_0 = ret[0];
      deferred1_1 = ret[1];
      return getStringFromWasm0(ret[0], ret[1]);
    } finally {
      wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
  }
  /**
   * @param {string} arg0
   */
  set effect_type(arg0) {
    const ptr0 = passStringToWasm0(
      arg0,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_effectsize_effect_type(this.__wbg_ptr, ptr0, len0);
  }
}

const FishersExactTestResultFinalization =
  (typeof FinalizationRegistry === "undefined")
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry((ptr) =>
      wasm.__wbg_fishersexacttestresult_free(ptr >>> 0, 1)
    );
/**
 * Fisher's exact test result
 */
export class FishersExactTestResult {
  static __wrap(ptr) {
    ptr = ptr >>> 0;
    const obj = Object.create(FishersExactTestResult.prototype);
    obj.__wbg_ptr = ptr;
    FishersExactTestResultFinalization.register(obj, obj.__wbg_ptr, obj);
    return obj;
  }

  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    FishersExactTestResultFinalization.unregister(this);
    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_fishersexacttestresult_free(ptr, 0);
  }
  /**
   * @returns {TestStatistic}
   */
  get test_statistic() {
    const ret = wasm.__wbg_get_fishersexacttestresult_test_statistic(
      this.__wbg_ptr,
    );
    return TestStatistic.__wrap(ret);
  }
  /**
   * @param {TestStatistic} arg0
   */
  set test_statistic(arg0) {
    _assertClass(arg0, TestStatistic);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_fishersexacttestresult_test_statistic(this.__wbg_ptr, ptr0);
  }
  /**
   * @returns {number}
   */
  get p_value() {
    const ret = wasm.__wbg_get_anovatestcomponent_mean_square(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set p_value(arg0) {
    wasm.__wbg_set_anovatestcomponent_mean_square(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {string}
   */
  get test_name() {
    let deferred1_0;
    let deferred1_1;
    try {
      const ret = wasm.__wbg_get_fishersexacttestresult_test_name(
        this.__wbg_ptr,
      );
      deferred1_0 = ret[0];
      deferred1_1 = ret[1];
      return getStringFromWasm0(ret[0], ret[1]);
    } finally {
      wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
  }
  /**
   * @param {string} arg0
   */
  set test_name(arg0) {
    const ptr0 = passStringToWasm0(
      arg0,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_fishersexacttestresult_test_name(this.__wbg_ptr, ptr0, len0);
  }
  /**
   * @returns {number}
   */
  get alpha() {
    const ret = wasm.__wbg_get_anovatestcomponent_sum_of_squares(
      this.__wbg_ptr,
    );
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set alpha(arg0) {
    wasm.__wbg_set_anovatestcomponent_sum_of_squares(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {string | undefined}
   */
  get error_message() {
    const ret = wasm.__wbg_get_fishersexacttestresult_error_message(
      this.__wbg_ptr,
    );
    let v1;
    if (ret[0] !== 0) {
      v1 = getStringFromWasm0(ret[0], ret[1]).slice();
      wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    }
    return v1;
  }
  /**
   * @param {string | null} [arg0]
   */
  set error_message(arg0) {
    var ptr0 = isLikeNone(arg0)
      ? 0
      : passStringToWasm0(
        arg0,
        wasm.__wbindgen_malloc,
        wasm.__wbindgen_realloc,
      );
    var len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_fishersexacttestresult_error_message(
      this.__wbg_ptr,
      ptr0,
      len0,
    );
  }
  /**
   * @returns {ConfidenceInterval}
   */
  get confidence_interval() {
    const ret = wasm.__wbg_get_fishersexacttestresult_confidence_interval(
      this.__wbg_ptr,
    );
    return ConfidenceInterval.__wrap(ret);
  }
  /**
   * @param {ConfidenceInterval} arg0
   */
  set confidence_interval(arg0) {
    _assertClass(arg0, ConfidenceInterval);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_fishersexacttestresult_confidence_interval(
      this.__wbg_ptr,
      ptr0,
    );
  }
  /**
   * @returns {EffectSize}
   */
  get effect_size() {
    const ret = wasm.__wbg_get_fishersexacttestresult_effect_size(
      this.__wbg_ptr,
    );
    return EffectSize.__wrap(ret);
  }
  /**
   * @param {EffectSize} arg0
   */
  set effect_size(arg0) {
    _assertClass(arg0, EffectSize);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_fishersexacttestresult_effect_size(this.__wbg_ptr, ptr0);
  }
  /**
   * @returns {string}
   */
  get method() {
    let deferred1_0;
    let deferred1_1;
    try {
      const ret = wasm.__wbg_get_fishersexacttestresult_method(this.__wbg_ptr);
      deferred1_0 = ret[0];
      deferred1_1 = ret[1];
      return getStringFromWasm0(ret[0], ret[1]);
    } finally {
      wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
  }
  /**
   * @param {string} arg0
   */
  set method(arg0) {
    const ptr0 = passStringToWasm0(
      arg0,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_fishersexacttestresult_method(this.__wbg_ptr, ptr0, len0);
  }
  /**
   * @returns {string}
   */
  get method_type() {
    let deferred1_0;
    let deferred1_1;
    try {
      const ret = wasm.__wbg_get_fishersexacttestresult_method_type(
        this.__wbg_ptr,
      );
      deferred1_0 = ret[0];
      deferred1_1 = ret[1];
      return getStringFromWasm0(ret[0], ret[1]);
    } finally {
      wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
  }
  /**
   * @param {string} arg0
   */
  set method_type(arg0) {
    const ptr0 = passStringToWasm0(
      arg0,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_fishersexacttestresult_method_type(
      this.__wbg_ptr,
      ptr0,
      len0,
    );
  }
  /**
   * @returns {number | undefined}
   */
  get mid_p_value() {
    const ret = wasm.__wbg_get_fishersexacttestresult_mid_p_value(
      this.__wbg_ptr,
    );
    return ret[0] === 0 ? undefined : ret[1];
  }
  /**
   * @param {number | null} [arg0]
   */
  set mid_p_value(arg0) {
    wasm.__wbg_set_anovatablecomponent_ms(
      this.__wbg_ptr,
      !isLikeNone(arg0),
      isLikeNone(arg0) ? 0 : arg0,
    );
  }
  /**
   * @returns {string}
   */
  get alternative() {
    let deferred1_0;
    let deferred1_1;
    try {
      const ret = wasm.__wbg_get_fishersexacttestresult_alternative(
        this.__wbg_ptr,
      );
      deferred1_0 = ret[0];
      deferred1_1 = ret[1];
      return getStringFromWasm0(ret[0], ret[1]);
    } finally {
      wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
  }
  /**
   * @param {string} arg0
   */
  set alternative(arg0) {
    const ptr0 = passStringToWasm0(
      arg0,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_fishersexacttestresult_alternative(
      this.__wbg_ptr,
      ptr0,
      len0,
    );
  }
}

const GamesHowellTestResultFinalization =
  (typeof FinalizationRegistry === "undefined")
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry((ptr) =>
      wasm.__wbg_gameshowelltestresult_free(ptr >>> 0, 1)
    );
/**
 * Result structure for Games-Howell test
 */
export class GamesHowellTestResult {
  static __wrap(ptr) {
    ptr = ptr >>> 0;
    const obj = Object.create(GamesHowellTestResult.prototype);
    obj.__wbg_ptr = ptr;
    GamesHowellTestResultFinalization.register(obj, obj.__wbg_ptr, obj);
    return obj;
  }

  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    GamesHowellTestResultFinalization.unregister(this);
    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_gameshowelltestresult_free(ptr, 0);
  }
  /**
   * Test statistic for the overall test (if applicable)
   * @returns {TestStatistic}
   */
  get test_statistic() {
    const ret = wasm.__wbg_get_anovatestcomponent_test_statistic(
      this.__wbg_ptr,
    );
    return TestStatistic.__wrap(ret);
  }
  /**
   * Test statistic for the overall test (if applicable)
   * @param {TestStatistic} arg0
   */
  set test_statistic(arg0) {
    _assertClass(arg0, TestStatistic);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_anovatestcomponent_test_statistic(this.__wbg_ptr, ptr0);
  }
  /**
   * P-value for the overall test (if applicable)
   * @returns {number}
   */
  get p_value() {
    const ret = wasm.__wbg_get_dunntestresult_p_value(this.__wbg_ptr);
    return ret;
  }
  /**
   * P-value for the overall test (if applicable)
   * @param {number} arg0
   */
  set p_value(arg0) {
    wasm.__wbg_set_dunntestresult_p_value(this.__wbg_ptr, arg0);
  }
  /**
   * Name of the test performed
   * @returns {string}
   */
  get test_name() {
    let deferred1_0;
    let deferred1_1;
    try {
      const ret = wasm.__wbg_get_gameshowelltestresult_test_name(
        this.__wbg_ptr,
      );
      deferred1_0 = ret[0];
      deferred1_1 = ret[1];
      return getStringFromWasm0(ret[0], ret[1]);
    } finally {
      wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
  }
  /**
   * Name of the test performed
   * @param {string} arg0
   */
  set test_name(arg0) {
    const ptr0 = passStringToWasm0(
      arg0,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_dunntestresult_test_name(this.__wbg_ptr, ptr0, len0);
  }
  /**
   * Significance level used
   * @returns {number}
   */
  get alpha() {
    const ret = wasm.__wbg_get_dunntestresult_alpha(this.__wbg_ptr);
    return ret;
  }
  /**
   * Significance level used
   * @param {number} arg0
   */
  set alpha(arg0) {
    wasm.__wbg_set_dunntestresult_alpha(this.__wbg_ptr, arg0);
  }
  /**
   * Error message if test failed
   * @returns {string | undefined}
   */
  get error_message() {
    const ret = wasm.__wbg_get_gameshowelltestresult_error_message(
      this.__wbg_ptr,
    );
    let v1;
    if (ret[0] !== 0) {
      v1 = getStringFromWasm0(ret[0], ret[1]).slice();
      wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    }
    return v1;
  }
  /**
   * Error message if test failed
   * @param {string | null} [arg0]
   */
  set error_message(arg0) {
    var ptr0 = isLikeNone(arg0)
      ? 0
      : passStringToWasm0(
        arg0,
        wasm.__wbindgen_malloc,
        wasm.__wbindgen_realloc,
      );
    var len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_dunntestresult_error_message(this.__wbg_ptr, ptr0, len0);
  }
  /**
   * Explanatory note about the header values
   * @returns {string | undefined}
   */
  get note() {
    const ret = wasm.__wbg_get_gameshowelltestresult_note(this.__wbg_ptr);
    let v1;
    if (ret[0] !== 0) {
      v1 = getStringFromWasm0(ret[0], ret[1]).slice();
      wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    }
    return v1;
  }
  /**
   * Explanatory note about the header values
   * @param {string | null} [arg0]
   */
  set note(arg0) {
    var ptr0 = isLikeNone(arg0)
      ? 0
      : passStringToWasm0(
        arg0,
        wasm.__wbindgen_malloc,
        wasm.__wbindgen_realloc,
      );
    var len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_dunntestresult_note(this.__wbg_ptr, ptr0, len0);
  }
  /**
   * Multiple comparison correction method used
   * @returns {string}
   */
  get correction_method() {
    let deferred1_0;
    let deferred1_1;
    try {
      const ret = wasm.__wbg_get_gameshowelltestresult_correction_method(
        this.__wbg_ptr,
      );
      deferred1_0 = ret[0];
      deferred1_1 = ret[1];
      return getStringFromWasm0(ret[0], ret[1]);
    } finally {
      wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
  }
  /**
   * Multiple comparison correction method used
   * @param {string} arg0
   */
  set correction_method(arg0) {
    const ptr0 = passStringToWasm0(
      arg0,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_dunntestresult_correction_method(this.__wbg_ptr, ptr0, len0);
  }
  /**
   * Number of groups compared
   * @returns {number}
   */
  get n_groups() {
    const ret = wasm.__wbg_get_dunntestresult_n_groups(this.__wbg_ptr);
    return ret >>> 0;
  }
  /**
   * Number of groups compared
   * @param {number} arg0
   */
  set n_groups(arg0) {
    wasm.__wbg_set_dunntestresult_n_groups(this.__wbg_ptr, arg0);
  }
  /**
   * Total sample size
   * @returns {number}
   */
  get n_total() {
    const ret = wasm.__wbg_get_dunntestresult_n_total(this.__wbg_ptr);
    return ret >>> 0;
  }
  /**
   * Total sample size
   * @param {number} arg0
   */
  set n_total(arg0) {
    wasm.__wbg_set_dunntestresult_n_total(this.__wbg_ptr, arg0);
  }
  /**
   * Individual pairwise comparisons
   * @returns {PairwiseComparison[]}
   */
  get comparisons() {
    const ret = wasm.__wbg_get_gameshowelltestresult_comparisons(
      this.__wbg_ptr,
    );
    var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
    return v1;
  }
  /**
   * Individual pairwise comparisons
   * @param {PairwiseComparison[]} arg0
   */
  set comparisons(arg0) {
    const ptr0 = passArrayJsValueToWasm0(arg0, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_dunntestresult_comparisons(this.__wbg_ptr, ptr0, len0);
  }
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

const KendallCorrelationTestResultFinalization =
  (typeof FinalizationRegistry === "undefined")
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry((ptr) =>
      wasm.__wbg_kendallcorrelationtestresult_free(ptr >>> 0, 1)
    );
/**
 * Kendall correlation test result
 */
export class KendallCorrelationTestResult {
  static __wrap(ptr) {
    ptr = ptr >>> 0;
    const obj = Object.create(KendallCorrelationTestResult.prototype);
    obj.__wbg_ptr = ptr;
    KendallCorrelationTestResultFinalization.register(obj, obj.__wbg_ptr, obj);
    return obj;
  }

  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    KendallCorrelationTestResultFinalization.unregister(this);
    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_kendallcorrelationtestresult_free(ptr, 0);
  }
  /**
   * @returns {TestStatistic}
   */
  get test_statistic() {
    const ret = wasm.__wbg_get_anovatestcomponent_test_statistic(
      this.__wbg_ptr,
    );
    return TestStatistic.__wrap(ret);
  }
  /**
   * @param {TestStatistic} arg0
   */
  set test_statistic(arg0) {
    _assertClass(arg0, TestStatistic);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_anovatestcomponent_test_statistic(this.__wbg_ptr, ptr0);
  }
  /**
   * @returns {number}
   */
  get p_value() {
    const ret = wasm.__wbg_get_anovatestcomponent_p_value(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set p_value(arg0) {
    wasm.__wbg_set_anovatestcomponent_p_value(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {string}
   */
  get test_name() {
    let deferred1_0;
    let deferred1_1;
    try {
      const ret = wasm.__wbg_get_kendallcorrelationtestresult_test_name(
        this.__wbg_ptr,
      );
      deferred1_0 = ret[0];
      deferred1_1 = ret[1];
      return getStringFromWasm0(ret[0], ret[1]);
    } finally {
      wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
  }
  /**
   * @param {string} arg0
   */
  set test_name(arg0) {
    const ptr0 = passStringToWasm0(
      arg0,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_kendallcorrelationtestresult_test_name(
      this.__wbg_ptr,
      ptr0,
      len0,
    );
  }
  /**
   * @returns {number}
   */
  get alpha() {
    const ret = wasm.__wbg_get_anovatestcomponent_degrees_of_freedom(
      this.__wbg_ptr,
    );
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set alpha(arg0) {
    wasm.__wbg_set_anovatestcomponent_degrees_of_freedom(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {string | undefined}
   */
  get error_message() {
    const ret = wasm.__wbg_get_kendallcorrelationtestresult_error_message(
      this.__wbg_ptr,
    );
    let v1;
    if (ret[0] !== 0) {
      v1 = getStringFromWasm0(ret[0], ret[1]).slice();
      wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    }
    return v1;
  }
  /**
   * @param {string | null} [arg0]
   */
  set error_message(arg0) {
    var ptr0 = isLikeNone(arg0)
      ? 0
      : passStringToWasm0(
        arg0,
        wasm.__wbindgen_malloc,
        wasm.__wbindgen_realloc,
      );
    var len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_kendallcorrelationtestresult_error_message(
      this.__wbg_ptr,
      ptr0,
      len0,
    );
  }
  /**
   * @returns {ConfidenceInterval}
   */
  get confidence_interval() {
    const ret = wasm.__wbg_get_kendallcorrelationtestresult_confidence_interval(
      this.__wbg_ptr,
    );
    return ConfidenceInterval.__wrap(ret);
  }
  /**
   * @param {ConfidenceInterval} arg0
   */
  set confidence_interval(arg0) {
    _assertClass(arg0, ConfidenceInterval);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_kendallcorrelationtestresult_confidence_interval(
      this.__wbg_ptr,
      ptr0,
    );
  }
  /**
   * @returns {EffectSize}
   */
  get effect_size() {
    const ret = wasm.__wbg_get_anovatestcomponent_effect_size(this.__wbg_ptr);
    return EffectSize.__wrap(ret);
  }
  /**
   * @param {EffectSize} arg0
   */
  set effect_size(arg0) {
    _assertClass(arg0, EffectSize);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_anovatestcomponent_effect_size(this.__wbg_ptr, ptr0);
  }
}

const KolmogorovSmirnovTestResultFinalization =
  (typeof FinalizationRegistry === "undefined")
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry((ptr) =>
      wasm.__wbg_kolmogorovsmirnovtestresult_free(ptr >>> 0, 1)
    );

export class KolmogorovSmirnovTestResult {
  static __wrap(ptr) {
    ptr = ptr >>> 0;
    const obj = Object.create(KolmogorovSmirnovTestResult.prototype);
    obj.__wbg_ptr = ptr;
    KolmogorovSmirnovTestResultFinalization.register(obj, obj.__wbg_ptr, obj);
    return obj;
  }

  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    KolmogorovSmirnovTestResultFinalization.unregister(this);
    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_kolmogorovsmirnovtestresult_free(ptr, 0);
  }
  /**
   * @returns {number}
   */
  get p_value() {
    const ret = wasm.__wbg_get_dunntestresult_p_value(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set p_value(arg0) {
    wasm.__wbg_set_dunntestresult_p_value(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {number}
   */
  get alpha() {
    const ret = wasm.__wbg_get_dunntestresult_alpha(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set alpha(arg0) {
    wasm.__wbg_set_dunntestresult_alpha(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {number}
   */
  get sample1_size() {
    const ret = wasm.__wbg_get_kolmogorovsmirnovtestresult_sample1_size(
      this.__wbg_ptr,
    );
    return ret >>> 0;
  }
  /**
   * @param {number} arg0
   */
  set sample1_size(arg0) {
    wasm.__wbg_set_kolmogorovsmirnovtestresult_sample1_size(
      this.__wbg_ptr,
      arg0,
    );
  }
  /**
   * @returns {number}
   */
  get sample2_size() {
    const ret = wasm.__wbg_get_dunntestresult_n_groups(this.__wbg_ptr);
    return ret >>> 0;
  }
  /**
   * @param {number} arg0
   */
  set sample2_size(arg0) {
    wasm.__wbg_set_dunntestresult_n_groups(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {number}
   */
  get critical_value() {
    const ret = wasm.__wbg_get_kolmogorovsmirnovtestresult_critical_value(
      this.__wbg_ptr,
    );
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set critical_value(arg0) {
    wasm.__wbg_set_kolmogorovsmirnovtestresult_critical_value(
      this.__wbg_ptr,
      arg0,
    );
  }
  /**
   * @returns {number}
   */
  get d_statistic() {
    const ret = wasm.__wbg_get_anovatestcomponent_p_value(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set d_statistic(arg0) {
    wasm.__wbg_set_anovatestcomponent_p_value(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {number}
   */
  get d_plus() {
    const ret = wasm.__wbg_get_anovatestcomponent_degrees_of_freedom(
      this.__wbg_ptr,
    );
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set d_plus(arg0) {
    wasm.__wbg_set_anovatestcomponent_degrees_of_freedom(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {number}
   */
  get d_minus() {
    const ret = wasm.__wbg_get_anovatestcomponent_mean_square(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set d_minus(arg0) {
    wasm.__wbg_set_anovatestcomponent_mean_square(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {TestStatistic}
   */
  get test_statistic() {
    const ret = wasm.kolmogorovsmirnovtestresult_test_statistic(this.__wbg_ptr);
    return TestStatistic.__wrap(ret);
  }
  /**
   * @returns {string}
   */
  get test_name() {
    let deferred1_0;
    let deferred1_1;
    try {
      const ret = wasm.kolmogorovsmirnovtestresult_test_name(this.__wbg_ptr);
      deferred1_0 = ret[0];
      deferred1_1 = ret[1];
      return getStringFromWasm0(ret[0], ret[1]);
    } finally {
      wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
  }
  /**
   * @returns {string}
   */
  get alternative() {
    let deferred1_0;
    let deferred1_1;
    try {
      const ret = wasm.kolmogorovsmirnovtestresult_alternative(this.__wbg_ptr);
      deferred1_0 = ret[0];
      deferred1_1 = ret[1];
      return getStringFromWasm0(ret[0], ret[1]);
    } finally {
      wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
  }
}

const KruskalWallisTestResultFinalization =
  (typeof FinalizationRegistry === "undefined")
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry((ptr) =>
      wasm.__wbg_kruskalwallistestresult_free(ptr >>> 0, 1)
    );
/**
 * Kruskal-Wallis test result
 */
export class KruskalWallisTestResult {
  static __wrap(ptr) {
    ptr = ptr >>> 0;
    const obj = Object.create(KruskalWallisTestResult.prototype);
    obj.__wbg_ptr = ptr;
    KruskalWallisTestResultFinalization.register(obj, obj.__wbg_ptr, obj);
    return obj;
  }

  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    KruskalWallisTestResultFinalization.unregister(this);
    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_kruskalwallistestresult_free(ptr, 0);
  }
  /**
   * @returns {TestStatistic}
   */
  get test_statistic() {
    const ret = wasm.__wbg_get_anovatestcomponent_test_statistic(
      this.__wbg_ptr,
    );
    return TestStatistic.__wrap(ret);
  }
  /**
   * @param {TestStatistic} arg0
   */
  set test_statistic(arg0) {
    _assertClass(arg0, TestStatistic);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_anovatestcomponent_test_statistic(this.__wbg_ptr, ptr0);
  }
  /**
   * @returns {number}
   */
  get p_value() {
    const ret = wasm.__wbg_get_anovatestcomponent_p_value(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set p_value(arg0) {
    wasm.__wbg_set_anovatestcomponent_p_value(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {string}
   */
  get test_name() {
    let deferred1_0;
    let deferred1_1;
    try {
      const ret = wasm.__wbg_get_kruskalwallistestresult_test_name(
        this.__wbg_ptr,
      );
      deferred1_0 = ret[0];
      deferred1_1 = ret[1];
      return getStringFromWasm0(ret[0], ret[1]);
    } finally {
      wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
  }
  /**
   * @param {string} arg0
   */
  set test_name(arg0) {
    const ptr0 = passStringToWasm0(
      arg0,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_chisquaregoodnessoffittestresult_test_name(
      this.__wbg_ptr,
      ptr0,
      len0,
    );
  }
  /**
   * @returns {number}
   */
  get alpha() {
    const ret = wasm.__wbg_get_anovatestcomponent_degrees_of_freedom(
      this.__wbg_ptr,
    );
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set alpha(arg0) {
    wasm.__wbg_set_anovatestcomponent_degrees_of_freedom(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {string | undefined}
   */
  get error_message() {
    const ret = wasm.__wbg_get_kruskalwallistestresult_error_message(
      this.__wbg_ptr,
    );
    let v1;
    if (ret[0] !== 0) {
      v1 = getStringFromWasm0(ret[0], ret[1]).slice();
      wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    }
    return v1;
  }
  /**
   * @param {string | null} [arg0]
   */
  set error_message(arg0) {
    var ptr0 = isLikeNone(arg0)
      ? 0
      : passStringToWasm0(
        arg0,
        wasm.__wbindgen_malloc,
        wasm.__wbindgen_realloc,
      );
    var len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_kruskalwallistestresult_error_message(
      this.__wbg_ptr,
      ptr0,
      len0,
    );
  }
  /**
   * @returns {number}
   */
  get degrees_of_freedom() {
    const ret = wasm.__wbg_get_anovatestcomponent_mean_square(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set degrees_of_freedom(arg0) {
    wasm.__wbg_set_anovatestcomponent_mean_square(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {EffectSize}
   */
  get effect_size() {
    const ret = wasm.__wbg_get_anovatestcomponent_effect_size(this.__wbg_ptr);
    return EffectSize.__wrap(ret);
  }
  /**
   * @param {EffectSize} arg0
   */
  set effect_size(arg0) {
    _assertClass(arg0, EffectSize);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_anovatestcomponent_effect_size(this.__wbg_ptr, ptr0);
  }
  /**
   * @returns {number}
   */
  get sample_size() {
    const ret = wasm.__wbg_get_kolmogorovsmirnovtestresult_sample1_size(
      this.__wbg_ptr,
    );
    return ret >>> 0;
  }
  /**
   * @param {number} arg0
   */
  set sample_size(arg0) {
    wasm.__wbg_set_kolmogorovsmirnovtestresult_sample1_size(
      this.__wbg_ptr,
      arg0,
    );
  }
}

const MannWhitneyTestResultFinalization =
  (typeof FinalizationRegistry === "undefined")
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry((ptr) =>
      wasm.__wbg_mannwhitneytestresult_free(ptr >>> 0, 1)
    );
/**
 * Mann-Whitney test result with method information
 */
export class MannWhitneyTestResult {
  static __wrap(ptr) {
    ptr = ptr >>> 0;
    const obj = Object.create(MannWhitneyTestResult.prototype);
    obj.__wbg_ptr = ptr;
    MannWhitneyTestResultFinalization.register(obj, obj.__wbg_ptr, obj);
    return obj;
  }

  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    MannWhitneyTestResultFinalization.unregister(this);
    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_mannwhitneytestresult_free(ptr, 0);
  }
  /**
   * @returns {TestStatistic}
   */
  get test_statistic() {
    const ret = wasm.__wbg_get_anovatestcomponent_test_statistic(
      this.__wbg_ptr,
    );
    return TestStatistic.__wrap(ret);
  }
  /**
   * @param {TestStatistic} arg0
   */
  set test_statistic(arg0) {
    _assertClass(arg0, TestStatistic);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_anovatestcomponent_test_statistic(this.__wbg_ptr, ptr0);
  }
  /**
   * @returns {number}
   */
  get p_value() {
    const ret = wasm.__wbg_get_anovatestcomponent_p_value(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set p_value(arg0) {
    wasm.__wbg_set_anovatestcomponent_p_value(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {string}
   */
  get test_name() {
    let deferred1_0;
    let deferred1_1;
    try {
      const ret = wasm.__wbg_get_mannwhitneytestresult_test_name(
        this.__wbg_ptr,
      );
      deferred1_0 = ret[0];
      deferred1_1 = ret[1];
      return getStringFromWasm0(ret[0], ret[1]);
    } finally {
      wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
  }
  /**
   * @param {string} arg0
   */
  set test_name(arg0) {
    const ptr0 = passStringToWasm0(
      arg0,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_mannwhitneytestresult_test_name(this.__wbg_ptr, ptr0, len0);
  }
  /**
   * @returns {string}
   */
  get method() {
    let deferred1_0;
    let deferred1_1;
    try {
      const ret = wasm.__wbg_get_mannwhitneytestresult_method(this.__wbg_ptr);
      deferred1_0 = ret[0];
      deferred1_1 = ret[1];
      return getStringFromWasm0(ret[0], ret[1]);
    } finally {
      wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
  }
  /**
   * @param {string} arg0
   */
  set method(arg0) {
    const ptr0 = passStringToWasm0(
      arg0,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_mannwhitneytestresult_method(this.__wbg_ptr, ptr0, len0);
  }
  /**
   * @returns {number}
   */
  get alpha() {
    const ret = wasm.__wbg_get_anovatestcomponent_degrees_of_freedom(
      this.__wbg_ptr,
    );
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set alpha(arg0) {
    wasm.__wbg_set_anovatestcomponent_degrees_of_freedom(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {string | undefined}
   */
  get error_message() {
    const ret = wasm.__wbg_get_mannwhitneytestresult_error_message(
      this.__wbg_ptr,
    );
    let v1;
    if (ret[0] !== 0) {
      v1 = getStringFromWasm0(ret[0], ret[1]).slice();
      wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    }
    return v1;
  }
  /**
   * @param {string | null} [arg0]
   */
  set error_message(arg0) {
    var ptr0 = isLikeNone(arg0)
      ? 0
      : passStringToWasm0(
        arg0,
        wasm.__wbindgen_malloc,
        wasm.__wbindgen_realloc,
      );
    var len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_kendallcorrelationtestresult_error_message(
      this.__wbg_ptr,
      ptr0,
      len0,
    );
  }
  /**
   * @returns {EffectSize}
   */
  get effect_size() {
    const ret = wasm.__wbg_get_anovatestcomponent_effect_size(this.__wbg_ptr);
    return EffectSize.__wrap(ret);
  }
  /**
   * @param {EffectSize} arg0
   */
  set effect_size(arg0) {
    _assertClass(arg0, EffectSize);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_anovatestcomponent_effect_size(this.__wbg_ptr, ptr0);
  }
  /**
   * @returns {string}
   */
  get alternative() {
    let deferred1_0;
    let deferred1_1;
    try {
      const ret = wasm.__wbg_get_mannwhitneytestresult_alternative(
        this.__wbg_ptr,
      );
      deferred1_0 = ret[0];
      deferred1_1 = ret[1];
      return getStringFromWasm0(ret[0], ret[1]);
    } finally {
      wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
  }
  /**
   * @param {string} arg0
   */
  set alternative(arg0) {
    const ptr0 = passStringToWasm0(
      arg0,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_kendallcorrelationtestresult_test_name(
      this.__wbg_ptr,
      ptr0,
      len0,
    );
  }
}

const OneSampleProportionTestResultFinalization =
  (typeof FinalizationRegistry === "undefined")
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry((ptr) =>
      wasm.__wbg_onesampleproportiontestresult_free(ptr >>> 0, 1)
    );
/**
 * One-sample proportion test result
 */
export class OneSampleProportionTestResult {
  static __wrap(ptr) {
    ptr = ptr >>> 0;
    const obj = Object.create(OneSampleProportionTestResult.prototype);
    obj.__wbg_ptr = ptr;
    OneSampleProportionTestResultFinalization.register(obj, obj.__wbg_ptr, obj);
    return obj;
  }

  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    OneSampleProportionTestResultFinalization.unregister(this);
    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_onesampleproportiontestresult_free(ptr, 0);
  }
  /**
   * @returns {TestStatistic}
   */
  get test_statistic() {
    const ret = wasm.__wbg_get_anovatestcomponent_test_statistic(
      this.__wbg_ptr,
    );
    return TestStatistic.__wrap(ret);
  }
  /**
   * @param {TestStatistic} arg0
   */
  set test_statistic(arg0) {
    _assertClass(arg0, TestStatistic);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_anovatestcomponent_test_statistic(this.__wbg_ptr, ptr0);
  }
  /**
   * @returns {number}
   */
  get p_value() {
    const ret = wasm.__wbg_get_dunntestresult_p_value(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set p_value(arg0) {
    wasm.__wbg_set_dunntestresult_p_value(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {string}
   */
  get test_name() {
    let deferred1_0;
    let deferred1_1;
    try {
      const ret = wasm.__wbg_get_onesampleproportiontestresult_test_name(
        this.__wbg_ptr,
      );
      deferred1_0 = ret[0];
      deferred1_1 = ret[1];
      return getStringFromWasm0(ret[0], ret[1]);
    } finally {
      wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
  }
  /**
   * @param {string} arg0
   */
  set test_name(arg0) {
    const ptr0 = passStringToWasm0(
      arg0,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_chisquaregoodnessoffittestresult_test_name(
      this.__wbg_ptr,
      ptr0,
      len0,
    );
  }
  /**
   * @returns {number}
   */
  get alpha() {
    const ret = wasm.__wbg_get_dunntestresult_alpha(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set alpha(arg0) {
    wasm.__wbg_set_dunntestresult_alpha(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {string | undefined}
   */
  get error_message() {
    const ret = wasm.__wbg_get_onesampleproportiontestresult_error_message(
      this.__wbg_ptr,
    );
    let v1;
    if (ret[0] !== 0) {
      v1 = getStringFromWasm0(ret[0], ret[1]).slice();
      wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    }
    return v1;
  }
  /**
   * @param {string | null} [arg0]
   */
  set error_message(arg0) {
    var ptr0 = isLikeNone(arg0)
      ? 0
      : passStringToWasm0(
        arg0,
        wasm.__wbindgen_malloc,
        wasm.__wbindgen_realloc,
      );
    var len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_kruskalwallistestresult_error_message(
      this.__wbg_ptr,
      ptr0,
      len0,
    );
  }
  /**
   * @returns {ConfidenceInterval}
   */
  get confidence_interval() {
    const ret = wasm
      .__wbg_get_onesampleproportiontestresult_confidence_interval(
        this.__wbg_ptr,
      );
    return ConfidenceInterval.__wrap(ret);
  }
  /**
   * @param {ConfidenceInterval} arg0
   */
  set confidence_interval(arg0) {
    _assertClass(arg0, ConfidenceInterval);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_onesampleproportiontestresult_confidence_interval(
      this.__wbg_ptr,
      ptr0,
    );
  }
  /**
   * @returns {number}
   */
  get sample_proportion() {
    const ret = wasm.__wbg_get_anovatestcomponent_mean_square(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set sample_proportion(arg0) {
    wasm.__wbg_set_anovatestcomponent_mean_square(this.__wbg_ptr, arg0);
  }
}

const OneSampleTTestResultFinalization =
  (typeof FinalizationRegistry === "undefined")
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry((ptr) =>
      wasm.__wbg_onesamplettestresult_free(ptr >>> 0, 1)
    );
/**
 * One-sample t-test result
 */
export class OneSampleTTestResult {
  static __wrap(ptr) {
    ptr = ptr >>> 0;
    const obj = Object.create(OneSampleTTestResult.prototype);
    obj.__wbg_ptr = ptr;
    OneSampleTTestResultFinalization.register(obj, obj.__wbg_ptr, obj);
    return obj;
  }

  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    OneSampleTTestResultFinalization.unregister(this);
    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_onesamplettestresult_free(ptr, 0);
  }
  /**
   * @returns {TestStatistic}
   */
  get test_statistic() {
    const ret = wasm.__wbg_get_anovatestcomponent_test_statistic(
      this.__wbg_ptr,
    );
    return TestStatistic.__wrap(ret);
  }
  /**
   * @param {TestStatistic} arg0
   */
  set test_statistic(arg0) {
    _assertClass(arg0, TestStatistic);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_anovatestcomponent_test_statistic(this.__wbg_ptr, ptr0);
  }
  /**
   * @returns {number}
   */
  get p_value() {
    const ret = wasm.__wbg_get_anovatestcomponent_p_value(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set p_value(arg0) {
    wasm.__wbg_set_anovatestcomponent_p_value(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {string}
   */
  get test_name() {
    let deferred1_0;
    let deferred1_1;
    try {
      const ret = wasm.__wbg_get_onesamplettestresult_test_name(this.__wbg_ptr);
      deferred1_0 = ret[0];
      deferred1_1 = ret[1];
      return getStringFromWasm0(ret[0], ret[1]);
    } finally {
      wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
  }
  /**
   * @param {string} arg0
   */
  set test_name(arg0) {
    const ptr0 = passStringToWasm0(
      arg0,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_chisquarevariancetestresult_test_name(
      this.__wbg_ptr,
      ptr0,
      len0,
    );
  }
  /**
   * @returns {number}
   */
  get alpha() {
    const ret = wasm.__wbg_get_anovatestcomponent_degrees_of_freedom(
      this.__wbg_ptr,
    );
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set alpha(arg0) {
    wasm.__wbg_set_anovatestcomponent_degrees_of_freedom(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {string | undefined}
   */
  get error_message() {
    const ret = wasm.__wbg_get_onesamplettestresult_error_message(
      this.__wbg_ptr,
    );
    let v1;
    if (ret[0] !== 0) {
      v1 = getStringFromWasm0(ret[0], ret[1]).slice();
      wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    }
    return v1;
  }
  /**
   * @param {string | null} [arg0]
   */
  set error_message(arg0) {
    var ptr0 = isLikeNone(arg0)
      ? 0
      : passStringToWasm0(
        arg0,
        wasm.__wbindgen_malloc,
        wasm.__wbindgen_realloc,
      );
    var len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_chisquarevariancetestresult_error_message(
      this.__wbg_ptr,
      ptr0,
      len0,
    );
  }
  /**
   * @returns {ConfidenceInterval}
   */
  get confidence_interval() {
    const ret = wasm.__wbg_get_kendallcorrelationtestresult_confidence_interval(
      this.__wbg_ptr,
    );
    return ConfidenceInterval.__wrap(ret);
  }
  /**
   * @param {ConfidenceInterval} arg0
   */
  set confidence_interval(arg0) {
    _assertClass(arg0, ConfidenceInterval);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_kendallcorrelationtestresult_confidence_interval(
      this.__wbg_ptr,
      ptr0,
    );
  }
  /**
   * @returns {number}
   */
  get degrees_of_freedom() {
    const ret = wasm.__wbg_get_onesamplettestresult_degrees_of_freedom(
      this.__wbg_ptr,
    );
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set degrees_of_freedom(arg0) {
    wasm.__wbg_set_onesamplettestresult_degrees_of_freedom(
      this.__wbg_ptr,
      arg0,
    );
  }
  /**
   * @returns {EffectSize}
   */
  get effect_size() {
    const ret = wasm.__wbg_get_anovatestcomponent_effect_size(this.__wbg_ptr);
    return EffectSize.__wrap(ret);
  }
  /**
   * @param {EffectSize} arg0
   */
  set effect_size(arg0) {
    _assertClass(arg0, EffectSize);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_anovatestcomponent_effect_size(this.__wbg_ptr, ptr0);
  }
}

const OneSampleZTestResultFinalization =
  (typeof FinalizationRegistry === "undefined")
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry((ptr) =>
      wasm.__wbg_onesampleztestresult_free(ptr >>> 0, 1)
    );
/**
 * One-sample Z-test result
 */
export class OneSampleZTestResult {
  static __wrap(ptr) {
    ptr = ptr >>> 0;
    const obj = Object.create(OneSampleZTestResult.prototype);
    obj.__wbg_ptr = ptr;
    OneSampleZTestResultFinalization.register(obj, obj.__wbg_ptr, obj);
    return obj;
  }

  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    OneSampleZTestResultFinalization.unregister(this);
    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_onesampleztestresult_free(ptr, 0);
  }
  /**
   * @returns {TestStatistic}
   */
  get test_statistic() {
    const ret = wasm.__wbg_get_anovatestcomponent_test_statistic(
      this.__wbg_ptr,
    );
    return TestStatistic.__wrap(ret);
  }
  /**
   * @param {TestStatistic} arg0
   */
  set test_statistic(arg0) {
    _assertClass(arg0, TestStatistic);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_anovatestcomponent_test_statistic(this.__wbg_ptr, ptr0);
  }
  /**
   * @returns {number}
   */
  get p_value() {
    const ret = wasm.__wbg_get_anovatestcomponent_p_value(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set p_value(arg0) {
    wasm.__wbg_set_anovatestcomponent_p_value(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {string}
   */
  get test_name() {
    let deferred1_0;
    let deferred1_1;
    try {
      const ret = wasm.__wbg_get_onesampleztestresult_test_name(this.__wbg_ptr);
      deferred1_0 = ret[0];
      deferred1_1 = ret[1];
      return getStringFromWasm0(ret[0], ret[1]);
    } finally {
      wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
  }
  /**
   * @param {string} arg0
   */
  set test_name(arg0) {
    const ptr0 = passStringToWasm0(
      arg0,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_kendallcorrelationtestresult_test_name(
      this.__wbg_ptr,
      ptr0,
      len0,
    );
  }
  /**
   * @returns {number}
   */
  get alpha() {
    const ret = wasm.__wbg_get_anovatestcomponent_degrees_of_freedom(
      this.__wbg_ptr,
    );
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set alpha(arg0) {
    wasm.__wbg_set_anovatestcomponent_degrees_of_freedom(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {string | undefined}
   */
  get error_message() {
    const ret = wasm.__wbg_get_onesampleztestresult_error_message(
      this.__wbg_ptr,
    );
    let v1;
    if (ret[0] !== 0) {
      v1 = getStringFromWasm0(ret[0], ret[1]).slice();
      wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    }
    return v1;
  }
  /**
   * @param {string | null} [arg0]
   */
  set error_message(arg0) {
    var ptr0 = isLikeNone(arg0)
      ? 0
      : passStringToWasm0(
        arg0,
        wasm.__wbindgen_malloc,
        wasm.__wbindgen_realloc,
      );
    var len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_kendallcorrelationtestresult_error_message(
      this.__wbg_ptr,
      ptr0,
      len0,
    );
  }
  /**
   * @returns {ConfidenceInterval}
   */
  get confidence_interval() {
    const ret = wasm.__wbg_get_kendallcorrelationtestresult_confidence_interval(
      this.__wbg_ptr,
    );
    return ConfidenceInterval.__wrap(ret);
  }
  /**
   * @param {ConfidenceInterval} arg0
   */
  set confidence_interval(arg0) {
    _assertClass(arg0, ConfidenceInterval);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_kendallcorrelationtestresult_confidence_interval(
      this.__wbg_ptr,
      ptr0,
    );
  }
  /**
   * @returns {EffectSize}
   */
  get effect_size() {
    const ret = wasm.__wbg_get_anovatestcomponent_effect_size(this.__wbg_ptr);
    return EffectSize.__wrap(ret);
  }
  /**
   * @param {EffectSize} arg0
   */
  set effect_size(arg0) {
    _assertClass(arg0, EffectSize);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_anovatestcomponent_effect_size(this.__wbg_ptr, ptr0);
  }
}

const OneWayAnovaTestResultFinalization =
  (typeof FinalizationRegistry === "undefined")
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry((ptr) =>
      wasm.__wbg_onewayanovatestresult_free(ptr >>> 0, 1)
    );
/**
 * One-way ANOVA test result with guaranteed properties
 */
export class OneWayAnovaTestResult {
  static __wrap(ptr) {
    ptr = ptr >>> 0;
    const obj = Object.create(OneWayAnovaTestResult.prototype);
    obj.__wbg_ptr = ptr;
    OneWayAnovaTestResultFinalization.register(obj, obj.__wbg_ptr, obj);
    return obj;
  }

  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    OneWayAnovaTestResultFinalization.unregister(this);
    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_onewayanovatestresult_free(ptr, 0);
  }
  /**
   * @returns {TestStatistic}
   */
  get test_statistic() {
    const ret = wasm.__wbg_get_anovatestcomponent_test_statistic(
      this.__wbg_ptr,
    );
    return TestStatistic.__wrap(ret);
  }
  /**
   * @param {TestStatistic} arg0
   */
  set test_statistic(arg0) {
    _assertClass(arg0, TestStatistic);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_anovatestcomponent_test_statistic(this.__wbg_ptr, ptr0);
  }
  /**
   * @returns {number}
   */
  get p_value() {
    const ret = wasm.__wbg_get_anovatestcomponent_p_value(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set p_value(arg0) {
    wasm.__wbg_set_anovatestcomponent_p_value(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {string}
   */
  get test_name() {
    let deferred1_0;
    let deferred1_1;
    try {
      const ret = wasm.__wbg_get_onewayanovatestresult_test_name(
        this.__wbg_ptr,
      );
      deferred1_0 = ret[0];
      deferred1_1 = ret[1];
      return getStringFromWasm0(ret[0], ret[1]);
    } finally {
      wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
  }
  /**
   * @param {string} arg0
   */
  set test_name(arg0) {
    const ptr0 = passStringToWasm0(
      arg0,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_kendallcorrelationtestresult_test_name(
      this.__wbg_ptr,
      ptr0,
      len0,
    );
  }
  /**
   * @returns {number}
   */
  get alpha() {
    const ret = wasm.__wbg_get_anovatestcomponent_degrees_of_freedom(
      this.__wbg_ptr,
    );
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set alpha(arg0) {
    wasm.__wbg_set_anovatestcomponent_degrees_of_freedom(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {string | undefined}
   */
  get error_message() {
    const ret = wasm.__wbg_get_onewayanovatestresult_error_message(
      this.__wbg_ptr,
    );
    let v1;
    if (ret[0] !== 0) {
      v1 = getStringFromWasm0(ret[0], ret[1]).slice();
      wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    }
    return v1;
  }
  /**
   * @param {string | null} [arg0]
   */
  set error_message(arg0) {
    var ptr0 = isLikeNone(arg0)
      ? 0
      : passStringToWasm0(
        arg0,
        wasm.__wbindgen_malloc,
        wasm.__wbindgen_realloc,
      );
    var len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_onewayanovatestresult_error_message(
      this.__wbg_ptr,
      ptr0,
      len0,
    );
  }
  /**
   * @returns {number}
   */
  get degrees_of_freedom() {
    const ret = wasm.__wbg_get_anovatestcomponent_mean_square(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set degrees_of_freedom(arg0) {
    wasm.__wbg_set_anovatestcomponent_mean_square(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {EffectSize}
   */
  get effect_size() {
    const ret = wasm.__wbg_get_anovatestcomponent_effect_size(this.__wbg_ptr);
    return EffectSize.__wrap(ret);
  }
  /**
   * @param {EffectSize} arg0
   */
  set effect_size(arg0) {
    _assertClass(arg0, EffectSize);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_anovatestcomponent_effect_size(this.__wbg_ptr, ptr0);
  }
  /**
   * @returns {number}
   */
  get sample_size() {
    const ret = wasm.__wbg_get_onewayanovatestresult_sample_size(
      this.__wbg_ptr,
    );
    return ret >>> 0;
  }
  /**
   * @param {number} arg0
   */
  set sample_size(arg0) {
    wasm.__wbg_set_onewayanovatestresult_sample_size(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {number}
   */
  get r_squared() {
    const ret = wasm.__wbg_get_anovatestcomponent_sum_of_squares(
      this.__wbg_ptr,
    );
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set r_squared(arg0) {
    wasm.__wbg_set_anovatestcomponent_sum_of_squares(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {number}
   */
  get adjusted_r_squared() {
    const ret = wasm.__wbg_get_onewayanovatestresult_adjusted_r_squared(
      this.__wbg_ptr,
    );
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set adjusted_r_squared(arg0) {
    wasm.__wbg_set_onewayanovatestresult_adjusted_r_squared(
      this.__wbg_ptr,
      arg0,
    );
  }
  /**
   * @returns {Float64Array}
   */
  get sample_means() {
    const ret = wasm.__wbg_get_onewayanovatestresult_sample_means(
      this.__wbg_ptr,
    );
    var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v1;
  }
  /**
   * @param {Float64Array} arg0
   */
  set sample_means(arg0) {
    const ptr0 = passArrayF64ToWasm0(arg0, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_onewayanovatestresult_sample_means(
      this.__wbg_ptr,
      ptr0,
      len0,
    );
  }
  /**
   * @returns {Float64Array}
   */
  get sample_std_devs() {
    const ret = wasm.__wbg_get_onewayanovatestresult_sample_std_devs(
      this.__wbg_ptr,
    );
    var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v1;
  }
  /**
   * @param {Float64Array} arg0
   */
  set sample_std_devs(arg0) {
    const ptr0 = passArrayF64ToWasm0(arg0, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_onewayanovatestresult_sample_std_devs(
      this.__wbg_ptr,
      ptr0,
      len0,
    );
  }
  /**
   * @returns {Float64Array}
   */
  get sum_of_squares() {
    const ret = wasm.__wbg_get_onewayanovatestresult_sum_of_squares(
      this.__wbg_ptr,
    );
    var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v1;
  }
  /**
   * @param {Float64Array} arg0
   */
  set sum_of_squares(arg0) {
    const ptr0 = passArrayF64ToWasm0(arg0, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_onewayanovatestresult_sum_of_squares(
      this.__wbg_ptr,
      ptr0,
      len0,
    );
  }
}

const PairedTTestResultFinalization =
  (typeof FinalizationRegistry === "undefined")
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry((ptr) =>
      wasm.__wbg_pairedttestresult_free(ptr >>> 0, 1)
    );
/**
 * Paired t-test result
 */
export class PairedTTestResult {
  static __wrap(ptr) {
    ptr = ptr >>> 0;
    const obj = Object.create(PairedTTestResult.prototype);
    obj.__wbg_ptr = ptr;
    PairedTTestResultFinalization.register(obj, obj.__wbg_ptr, obj);
    return obj;
  }

  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    PairedTTestResultFinalization.unregister(this);
    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_pairedttestresult_free(ptr, 0);
  }
  /**
   * @returns {TestStatistic}
   */
  get test_statistic() {
    const ret = wasm.__wbg_get_anovatestcomponent_test_statistic(
      this.__wbg_ptr,
    );
    return TestStatistic.__wrap(ret);
  }
  /**
   * @param {TestStatistic} arg0
   */
  set test_statistic(arg0) {
    _assertClass(arg0, TestStatistic);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_anovatestcomponent_test_statistic(this.__wbg_ptr, ptr0);
  }
  /**
   * @returns {number}
   */
  get p_value() {
    const ret = wasm.__wbg_get_anovatestcomponent_p_value(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set p_value(arg0) {
    wasm.__wbg_set_anovatestcomponent_p_value(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {string}
   */
  get test_name() {
    let deferred1_0;
    let deferred1_1;
    try {
      const ret = wasm.__wbg_get_pairedttestresult_test_name(this.__wbg_ptr);
      deferred1_0 = ret[0];
      deferred1_1 = ret[1];
      return getStringFromWasm0(ret[0], ret[1]);
    } finally {
      wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
  }
  /**
   * @param {string} arg0
   */
  set test_name(arg0) {
    const ptr0 = passStringToWasm0(
      arg0,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_anovatablecomponent_component(this.__wbg_ptr, ptr0, len0);
  }
  /**
   * @returns {number}
   */
  get alpha() {
    const ret = wasm.__wbg_get_anovatestcomponent_degrees_of_freedom(
      this.__wbg_ptr,
    );
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set alpha(arg0) {
    wasm.__wbg_set_anovatestcomponent_degrees_of_freedom(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {string | undefined}
   */
  get error_message() {
    const ret = wasm.__wbg_get_pairedttestresult_error_message(this.__wbg_ptr);
    let v1;
    if (ret[0] !== 0) {
      v1 = getStringFromWasm0(ret[0], ret[1]).slice();
      wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    }
    return v1;
  }
  /**
   * @param {string | null} [arg0]
   */
  set error_message(arg0) {
    var ptr0 = isLikeNone(arg0)
      ? 0
      : passStringToWasm0(
        arg0,
        wasm.__wbindgen_malloc,
        wasm.__wbindgen_realloc,
      );
    var len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_pairedttestresult_error_message(this.__wbg_ptr, ptr0, len0);
  }
  /**
   * @returns {ConfidenceInterval}
   */
  get confidence_interval() {
    const ret = wasm.__wbg_get_kendallcorrelationtestresult_confidence_interval(
      this.__wbg_ptr,
    );
    return ConfidenceInterval.__wrap(ret);
  }
  /**
   * @param {ConfidenceInterval} arg0
   */
  set confidence_interval(arg0) {
    _assertClass(arg0, ConfidenceInterval);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_kendallcorrelationtestresult_confidence_interval(
      this.__wbg_ptr,
      ptr0,
    );
  }
  /**
   * @returns {number}
   */
  get degrees_of_freedom() {
    const ret = wasm.__wbg_get_onesamplettestresult_degrees_of_freedom(
      this.__wbg_ptr,
    );
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set degrees_of_freedom(arg0) {
    wasm.__wbg_set_onesamplettestresult_degrees_of_freedom(
      this.__wbg_ptr,
      arg0,
    );
  }
  /**
   * @returns {EffectSize}
   */
  get effect_size() {
    const ret = wasm.__wbg_get_anovatestcomponent_effect_size(this.__wbg_ptr);
    return EffectSize.__wrap(ret);
  }
  /**
   * @param {EffectSize} arg0
   */
  set effect_size(arg0) {
    _assertClass(arg0, EffectSize);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_anovatestcomponent_effect_size(this.__wbg_ptr, ptr0);
  }
  /**
   * @returns {number}
   */
  get mean_difference() {
    const ret = wasm.__wbg_get_anovatablecomponent_ss(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set mean_difference(arg0) {
    wasm.__wbg_set_anovatablecomponent_ss(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {number}
   */
  get standard_error() {
    const ret = wasm.__wbg_get_anovatablecomponent_df(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set standard_error(arg0) {
    wasm.__wbg_set_anovatablecomponent_df(this.__wbg_ptr, arg0);
  }
}

const PairwiseComparisonFinalization =
  (typeof FinalizationRegistry === "undefined")
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry((ptr) =>
      wasm.__wbg_pairwisecomparison_free(ptr >>> 0, 1)
    );
/**
 * Result for a single pairwise comparison
 */
export class PairwiseComparison {
  static __wrap(ptr) {
    ptr = ptr >>> 0;
    const obj = Object.create(PairwiseComparison.prototype);
    obj.__wbg_ptr = ptr;
    PairwiseComparisonFinalization.register(obj, obj.__wbg_ptr, obj);
    return obj;
  }

  static __unwrap(jsValue) {
    if (!(jsValue instanceof PairwiseComparison)) {
      return 0;
    }
    return jsValue.__destroy_into_raw();
  }

  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    PairwiseComparisonFinalization.unregister(this);
    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_pairwisecomparison_free(ptr, 0);
  }
  /**
   * First group label/index
   * @returns {string}
   */
  get group1() {
    let deferred1_0;
    let deferred1_1;
    try {
      const ret = wasm.__wbg_get_pairwisecomparison_group1(this.__wbg_ptr);
      deferred1_0 = ret[0];
      deferred1_1 = ret[1];
      return getStringFromWasm0(ret[0], ret[1]);
    } finally {
      wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
  }
  /**
   * First group label/index
   * @param {string} arg0
   */
  set group1(arg0) {
    const ptr0 = passStringToWasm0(
      arg0,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_chisquareindependencetestresult_test_name(
      this.__wbg_ptr,
      ptr0,
      len0,
    );
  }
  /**
   * Second group label/index
   * @returns {string}
   */
  get group2() {
    let deferred1_0;
    let deferred1_1;
    try {
      const ret = wasm.__wbg_get_pairwisecomparison_group2(this.__wbg_ptr);
      deferred1_0 = ret[0];
      deferred1_1 = ret[1];
      return getStringFromWasm0(ret[0], ret[1]);
    } finally {
      wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
  }
  /**
   * Second group label/index
   * @param {string} arg0
   */
  set group2(arg0) {
    const ptr0 = passStringToWasm0(
      arg0,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_pairwisecomparison_group2(this.__wbg_ptr, ptr0, len0);
  }
  /**
   * Mean difference between groups
   * @returns {number}
   */
  get mean_difference() {
    const ret = wasm.__wbg_get_dunntestresult_p_value(this.__wbg_ptr);
    return ret;
  }
  /**
   * Mean difference between groups
   * @param {number} arg0
   */
  set mean_difference(arg0) {
    wasm.__wbg_set_dunntestresult_p_value(this.__wbg_ptr, arg0);
  }
  /**
   * Standard error of the difference
   * @returns {number}
   */
  get standard_error() {
    const ret = wasm.__wbg_get_dunntestresult_alpha(this.__wbg_ptr);
    return ret;
  }
  /**
   * Standard error of the difference
   * @param {number} arg0
   */
  set standard_error(arg0) {
    wasm.__wbg_set_dunntestresult_alpha(this.__wbg_ptr, arg0);
  }
  /**
   * Test statistic with name (q for Tukey, t for Games-Howell, z for Dunn)
   * @returns {TestStatistic}
   */
  get test_statistic() {
    const ret = wasm.__wbg_get_anovatestcomponent_test_statistic(
      this.__wbg_ptr,
    );
    return TestStatistic.__wrap(ret);
  }
  /**
   * Test statistic with name (q for Tukey, t for Games-Howell, z for Dunn)
   * @param {TestStatistic} arg0
   */
  set test_statistic(arg0) {
    _assertClass(arg0, TestStatistic);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_anovatestcomponent_test_statistic(this.__wbg_ptr, ptr0);
  }
  /**
   * P-value for the comparison
   * @returns {number}
   */
  get p_value() {
    const ret = wasm.__wbg_get_kolmogorovsmirnovtestresult_critical_value(
      this.__wbg_ptr,
    );
    return ret;
  }
  /**
   * P-value for the comparison
   * @param {number} arg0
   */
  set p_value(arg0) {
    wasm.__wbg_set_kolmogorovsmirnovtestresult_critical_value(
      this.__wbg_ptr,
      arg0,
    );
  }
  /**
   * Confidence interval for the difference
   * @returns {ConfidenceInterval}
   */
  get confidence_interval() {
    const ret = wasm.__wbg_get_pairwisecomparison_confidence_interval(
      this.__wbg_ptr,
    );
    return ConfidenceInterval.__wrap(ret);
  }
  /**
   * Confidence interval for the difference
   * @param {ConfidenceInterval} arg0
   */
  set confidence_interval(arg0) {
    _assertClass(arg0, ConfidenceInterval);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_pairwisecomparison_confidence_interval(this.__wbg_ptr, ptr0);
  }
  /**
   * Whether the difference is significant at the given alpha level
   * @returns {boolean}
   */
  get significant() {
    const ret = wasm.__wbg_get_pairwisecomparison_significant(this.__wbg_ptr);
    return ret !== 0;
  }
  /**
   * Whether the difference is significant at the given alpha level
   * @param {boolean} arg0
   */
  set significant(arg0) {
    wasm.__wbg_set_pairwisecomparison_significant(this.__wbg_ptr, arg0);
  }
  /**
   * Adjusted p-value (if applicable)
   * @returns {number}
   */
  get adjusted_p_value() {
    const ret = wasm.__wbg_get_anovatestcomponent_sum_of_squares(
      this.__wbg_ptr,
    );
    return ret;
  }
  /**
   * Adjusted p-value (if applicable)
   * @param {number} arg0
   */
  set adjusted_p_value(arg0) {
    wasm.__wbg_set_anovatestcomponent_sum_of_squares(this.__wbg_ptr, arg0);
  }
}

const PearsonCorrelationTestResultFinalization =
  (typeof FinalizationRegistry === "undefined")
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry((ptr) =>
      wasm.__wbg_pearsoncorrelationtestresult_free(ptr >>> 0, 1)
    );
/**
 * Pearson correlation test result
 */
export class PearsonCorrelationTestResult {
  static __wrap(ptr) {
    ptr = ptr >>> 0;
    const obj = Object.create(PearsonCorrelationTestResult.prototype);
    obj.__wbg_ptr = ptr;
    PearsonCorrelationTestResultFinalization.register(obj, obj.__wbg_ptr, obj);
    return obj;
  }

  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    PearsonCorrelationTestResultFinalization.unregister(this);
    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_pearsoncorrelationtestresult_free(ptr, 0);
  }
  /**
   * @returns {TestStatistic}
   */
  get test_statistic() {
    const ret = wasm.__wbg_get_anovatestcomponent_test_statistic(
      this.__wbg_ptr,
    );
    return TestStatistic.__wrap(ret);
  }
  /**
   * @param {TestStatistic} arg0
   */
  set test_statistic(arg0) {
    _assertClass(arg0, TestStatistic);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_anovatestcomponent_test_statistic(this.__wbg_ptr, ptr0);
  }
  /**
   * @returns {number}
   */
  get p_value() {
    const ret = wasm.__wbg_get_anovatestcomponent_p_value(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set p_value(arg0) {
    wasm.__wbg_set_anovatestcomponent_p_value(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {string}
   */
  get test_name() {
    let deferred1_0;
    let deferred1_1;
    try {
      const ret = wasm.__wbg_get_pearsoncorrelationtestresult_test_name(
        this.__wbg_ptr,
      );
      deferred1_0 = ret[0];
      deferred1_1 = ret[1];
      return getStringFromWasm0(ret[0], ret[1]);
    } finally {
      wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
  }
  /**
   * @param {string} arg0
   */
  set test_name(arg0) {
    const ptr0 = passStringToWasm0(
      arg0,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_chisquarevariancetestresult_test_name(
      this.__wbg_ptr,
      ptr0,
      len0,
    );
  }
  /**
   * @returns {number}
   */
  get alpha() {
    const ret = wasm.__wbg_get_anovatestcomponent_degrees_of_freedom(
      this.__wbg_ptr,
    );
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set alpha(arg0) {
    wasm.__wbg_set_anovatestcomponent_degrees_of_freedom(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {string | undefined}
   */
  get error_message() {
    const ret = wasm.__wbg_get_pearsoncorrelationtestresult_error_message(
      this.__wbg_ptr,
    );
    let v1;
    if (ret[0] !== 0) {
      v1 = getStringFromWasm0(ret[0], ret[1]).slice();
      wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    }
    return v1;
  }
  /**
   * @param {string | null} [arg0]
   */
  set error_message(arg0) {
    var ptr0 = isLikeNone(arg0)
      ? 0
      : passStringToWasm0(
        arg0,
        wasm.__wbindgen_malloc,
        wasm.__wbindgen_realloc,
      );
    var len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_chisquarevariancetestresult_error_message(
      this.__wbg_ptr,
      ptr0,
      len0,
    );
  }
  /**
   * @returns {ConfidenceInterval}
   */
  get confidence_interval() {
    const ret = wasm.__wbg_get_kendallcorrelationtestresult_confidence_interval(
      this.__wbg_ptr,
    );
    return ConfidenceInterval.__wrap(ret);
  }
  /**
   * @param {ConfidenceInterval} arg0
   */
  set confidence_interval(arg0) {
    _assertClass(arg0, ConfidenceInterval);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_kendallcorrelationtestresult_confidence_interval(
      this.__wbg_ptr,
      ptr0,
    );
  }
  /**
   * @returns {number}
   */
  get degrees_of_freedom() {
    const ret = wasm.__wbg_get_onesamplettestresult_degrees_of_freedom(
      this.__wbg_ptr,
    );
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set degrees_of_freedom(arg0) {
    wasm.__wbg_set_onesamplettestresult_degrees_of_freedom(
      this.__wbg_ptr,
      arg0,
    );
  }
  /**
   * @returns {EffectSize}
   */
  get effect_size() {
    const ret = wasm.__wbg_get_anovatestcomponent_effect_size(this.__wbg_ptr);
    return EffectSize.__wrap(ret);
  }
  /**
   * @param {EffectSize} arg0
   */
  set effect_size(arg0) {
    _assertClass(arg0, EffectSize);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_anovatestcomponent_effect_size(this.__wbg_ptr, ptr0);
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

const ShapiroWilkTestResultFinalization =
  (typeof FinalizationRegistry === "undefined")
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry((ptr) =>
      wasm.__wbg_shapirowilktestresult_free(ptr >>> 0, 1)
    );
/**
 * Shapiro-Wilk test result
 */
export class ShapiroWilkTestResult {
  static __wrap(ptr) {
    ptr = ptr >>> 0;
    const obj = Object.create(ShapiroWilkTestResult.prototype);
    obj.__wbg_ptr = ptr;
    ShapiroWilkTestResultFinalization.register(obj, obj.__wbg_ptr, obj);
    return obj;
  }

  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    ShapiroWilkTestResultFinalization.unregister(this);
    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_shapirowilktestresult_free(ptr, 0);
  }
  /**
   * @returns {TestStatistic}
   */
  get test_statistic() {
    const ret = wasm.__wbg_get_anovatestcomponent_test_statistic(
      this.__wbg_ptr,
    );
    return TestStatistic.__wrap(ret);
  }
  /**
   * @param {TestStatistic} arg0
   */
  set test_statistic(arg0) {
    _assertClass(arg0, TestStatistic);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_anovatestcomponent_test_statistic(this.__wbg_ptr, ptr0);
  }
  /**
   * @returns {number}
   */
  get p_value() {
    const ret = wasm.__wbg_get_dunntestresult_p_value(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set p_value(arg0) {
    wasm.__wbg_set_dunntestresult_p_value(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {string}
   */
  get test_name() {
    let deferred1_0;
    let deferred1_1;
    try {
      const ret = wasm.__wbg_get_shapirowilktestresult_test_name(
        this.__wbg_ptr,
      );
      deferred1_0 = ret[0];
      deferred1_1 = ret[1];
      return getStringFromWasm0(ret[0], ret[1]);
    } finally {
      wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
  }
  /**
   * @param {string} arg0
   */
  set test_name(arg0) {
    const ptr0 = passStringToWasm0(
      arg0,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_dunntestresult_test_name(this.__wbg_ptr, ptr0, len0);
  }
  /**
   * @returns {number}
   */
  get alpha() {
    const ret = wasm.__wbg_get_dunntestresult_alpha(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set alpha(arg0) {
    wasm.__wbg_set_dunntestresult_alpha(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {string | undefined}
   */
  get error_message() {
    const ret = wasm.__wbg_get_shapirowilktestresult_error_message(
      this.__wbg_ptr,
    );
    let v1;
    if (ret[0] !== 0) {
      v1 = getStringFromWasm0(ret[0], ret[1]).slice();
      wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    }
    return v1;
  }
  /**
   * @param {string | null} [arg0]
   */
  set error_message(arg0) {
    var ptr0 = isLikeNone(arg0)
      ? 0
      : passStringToWasm0(
        arg0,
        wasm.__wbindgen_malloc,
        wasm.__wbindgen_realloc,
      );
    var len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_shapirowilktestresult_error_message(
      this.__wbg_ptr,
      ptr0,
      len0,
    );
  }
  /**
   * @returns {number}
   */
  get sample_size() {
    const ret = wasm.__wbg_get_shapirowilktestresult_sample_size(
      this.__wbg_ptr,
    );
    return ret >>> 0;
  }
  /**
   * @param {number} arg0
   */
  set sample_size(arg0) {
    wasm.__wbg_set_shapirowilktestresult_sample_size(this.__wbg_ptr, arg0);
  }
}

const SpearmanCorrelationTestResultFinalization =
  (typeof FinalizationRegistry === "undefined")
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry((ptr) =>
      wasm.__wbg_spearmancorrelationtestresult_free(ptr >>> 0, 1)
    );
/**
 * Spearman correlation test result
 */
export class SpearmanCorrelationTestResult {
  static __wrap(ptr) {
    ptr = ptr >>> 0;
    const obj = Object.create(SpearmanCorrelationTestResult.prototype);
    obj.__wbg_ptr = ptr;
    SpearmanCorrelationTestResultFinalization.register(obj, obj.__wbg_ptr, obj);
    return obj;
  }

  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    SpearmanCorrelationTestResultFinalization.unregister(this);
    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_spearmancorrelationtestresult_free(ptr, 0);
  }
  /**
   * @returns {TestStatistic}
   */
  get test_statistic() {
    const ret = wasm.__wbg_get_anovatestcomponent_test_statistic(
      this.__wbg_ptr,
    );
    return TestStatistic.__wrap(ret);
  }
  /**
   * @param {TestStatistic} arg0
   */
  set test_statistic(arg0) {
    _assertClass(arg0, TestStatistic);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_anovatestcomponent_test_statistic(this.__wbg_ptr, ptr0);
  }
  /**
   * @returns {number}
   */
  get p_value() {
    const ret = wasm.__wbg_get_anovatestcomponent_p_value(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set p_value(arg0) {
    wasm.__wbg_set_anovatestcomponent_p_value(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {string}
   */
  get test_name() {
    let deferred1_0;
    let deferred1_1;
    try {
      const ret = wasm.__wbg_get_spearmancorrelationtestresult_test_name(
        this.__wbg_ptr,
      );
      deferred1_0 = ret[0];
      deferred1_1 = ret[1];
      return getStringFromWasm0(ret[0], ret[1]);
    } finally {
      wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
  }
  /**
   * @param {string} arg0
   */
  set test_name(arg0) {
    const ptr0 = passStringToWasm0(
      arg0,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_chisquarevariancetestresult_test_name(
      this.__wbg_ptr,
      ptr0,
      len0,
    );
  }
  /**
   * @returns {number}
   */
  get alpha() {
    const ret = wasm.__wbg_get_anovatestcomponent_degrees_of_freedom(
      this.__wbg_ptr,
    );
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set alpha(arg0) {
    wasm.__wbg_set_anovatestcomponent_degrees_of_freedom(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {string | undefined}
   */
  get error_message() {
    const ret = wasm.__wbg_get_spearmancorrelationtestresult_error_message(
      this.__wbg_ptr,
    );
    let v1;
    if (ret[0] !== 0) {
      v1 = getStringFromWasm0(ret[0], ret[1]).slice();
      wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    }
    return v1;
  }
  /**
   * @param {string | null} [arg0]
   */
  set error_message(arg0) {
    var ptr0 = isLikeNone(arg0)
      ? 0
      : passStringToWasm0(
        arg0,
        wasm.__wbindgen_malloc,
        wasm.__wbindgen_realloc,
      );
    var len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_chisquarevariancetestresult_error_message(
      this.__wbg_ptr,
      ptr0,
      len0,
    );
  }
  /**
   * @returns {ConfidenceInterval}
   */
  get confidence_interval() {
    const ret = wasm.__wbg_get_kendallcorrelationtestresult_confidence_interval(
      this.__wbg_ptr,
    );
    return ConfidenceInterval.__wrap(ret);
  }
  /**
   * @param {ConfidenceInterval} arg0
   */
  set confidence_interval(arg0) {
    _assertClass(arg0, ConfidenceInterval);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_kendallcorrelationtestresult_confidence_interval(
      this.__wbg_ptr,
      ptr0,
    );
  }
  /**
   * @returns {number}
   */
  get degrees_of_freedom() {
    const ret = wasm.__wbg_get_onesamplettestresult_degrees_of_freedom(
      this.__wbg_ptr,
    );
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set degrees_of_freedom(arg0) {
    wasm.__wbg_set_onesamplettestresult_degrees_of_freedom(
      this.__wbg_ptr,
      arg0,
    );
  }
  /**
   * @returns {EffectSize}
   */
  get effect_size() {
    const ret = wasm.__wbg_get_anovatestcomponent_effect_size(this.__wbg_ptr);
    return EffectSize.__wrap(ret);
  }
  /**
   * @param {EffectSize} arg0
   */
  set effect_size(arg0) {
    _assertClass(arg0, EffectSize);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_anovatestcomponent_effect_size(this.__wbg_ptr, ptr0);
  }
}

const TestStatisticFinalization = (typeof FinalizationRegistry === "undefined")
  ? { register: () => {}, unregister: () => {} }
  : new FinalizationRegistry((ptr) =>
    wasm.__wbg_teststatistic_free(ptr >>> 0, 1)
  );
/**
 * Test statistic with name
 */
export class TestStatistic {
  static __wrap(ptr) {
    ptr = ptr >>> 0;
    const obj = Object.create(TestStatistic.prototype);
    obj.__wbg_ptr = ptr;
    TestStatisticFinalization.register(obj, obj.__wbg_ptr, obj);
    return obj;
  }

  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    TestStatisticFinalization.unregister(this);
    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_teststatistic_free(ptr, 0);
  }
  /**
   * @returns {number}
   */
  get value() {
    const ret = wasm.__wbg_get_confidenceinterval_lower(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set value(arg0) {
    wasm.__wbg_set_confidenceinterval_lower(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {string}
   */
  get name() {
    let deferred1_0;
    let deferred1_1;
    try {
      const ret = wasm.__wbg_get_teststatistic_name(this.__wbg_ptr);
      deferred1_0 = ret[0];
      deferred1_1 = ret[1];
      return getStringFromWasm0(ret[0], ret[1]);
    } finally {
      wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
  }
  /**
   * @param {string} arg0
   */
  set name(arg0) {
    const ptr0 = passStringToWasm0(
      arg0,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_effectsize_effect_type(this.__wbg_ptr, ptr0, len0);
  }
}

const TukeyHsdTestResultFinalization =
  (typeof FinalizationRegistry === "undefined")
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry((ptr) =>
      wasm.__wbg_tukeyhsdtestresult_free(ptr >>> 0, 1)
    );
/**
 * Result structure for Tukey HSD test
 */
export class TukeyHsdTestResult {
  static __wrap(ptr) {
    ptr = ptr >>> 0;
    const obj = Object.create(TukeyHsdTestResult.prototype);
    obj.__wbg_ptr = ptr;
    TukeyHsdTestResultFinalization.register(obj, obj.__wbg_ptr, obj);
    return obj;
  }

  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    TukeyHsdTestResultFinalization.unregister(this);
    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_tukeyhsdtestresult_free(ptr, 0);
  }
  /**
   * Test statistic for the overall test (if applicable)
   * @returns {TestStatistic}
   */
  get test_statistic() {
    const ret = wasm.__wbg_get_anovatestcomponent_test_statistic(
      this.__wbg_ptr,
    );
    return TestStatistic.__wrap(ret);
  }
  /**
   * Test statistic for the overall test (if applicable)
   * @param {TestStatistic} arg0
   */
  set test_statistic(arg0) {
    _assertClass(arg0, TestStatistic);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_anovatestcomponent_test_statistic(this.__wbg_ptr, ptr0);
  }
  /**
   * P-value for the overall test (if applicable)
   * @returns {number}
   */
  get p_value() {
    const ret = wasm.__wbg_get_dunntestresult_p_value(this.__wbg_ptr);
    return ret;
  }
  /**
   * P-value for the overall test (if applicable)
   * @param {number} arg0
   */
  set p_value(arg0) {
    wasm.__wbg_set_dunntestresult_p_value(this.__wbg_ptr, arg0);
  }
  /**
   * Name of the test performed
   * @returns {string}
   */
  get test_name() {
    let deferred1_0;
    let deferred1_1;
    try {
      const ret = wasm.__wbg_get_tukeyhsdtestresult_test_name(this.__wbg_ptr);
      deferred1_0 = ret[0];
      deferred1_1 = ret[1];
      return getStringFromWasm0(ret[0], ret[1]);
    } finally {
      wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
  }
  /**
   * Name of the test performed
   * @param {string} arg0
   */
  set test_name(arg0) {
    const ptr0 = passStringToWasm0(
      arg0,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_dunntestresult_test_name(this.__wbg_ptr, ptr0, len0);
  }
  /**
   * Significance level used
   * @returns {number}
   */
  get alpha() {
    const ret = wasm.__wbg_get_dunntestresult_alpha(this.__wbg_ptr);
    return ret;
  }
  /**
   * Significance level used
   * @param {number} arg0
   */
  set alpha(arg0) {
    wasm.__wbg_set_dunntestresult_alpha(this.__wbg_ptr, arg0);
  }
  /**
   * Error message if test failed
   * @returns {string | undefined}
   */
  get error_message() {
    const ret = wasm.__wbg_get_tukeyhsdtestresult_error_message(this.__wbg_ptr);
    let v1;
    if (ret[0] !== 0) {
      v1 = getStringFromWasm0(ret[0], ret[1]).slice();
      wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    }
    return v1;
  }
  /**
   * Error message if test failed
   * @param {string | null} [arg0]
   */
  set error_message(arg0) {
    var ptr0 = isLikeNone(arg0)
      ? 0
      : passStringToWasm0(
        arg0,
        wasm.__wbindgen_malloc,
        wasm.__wbindgen_realloc,
      );
    var len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_dunntestresult_error_message(this.__wbg_ptr, ptr0, len0);
  }
  /**
   * Explanatory note about the header values
   * @returns {string | undefined}
   */
  get note() {
    const ret = wasm.__wbg_get_tukeyhsdtestresult_note(this.__wbg_ptr);
    let v1;
    if (ret[0] !== 0) {
      v1 = getStringFromWasm0(ret[0], ret[1]).slice();
      wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    }
    return v1;
  }
  /**
   * Explanatory note about the header values
   * @param {string | null} [arg0]
   */
  set note(arg0) {
    var ptr0 = isLikeNone(arg0)
      ? 0
      : passStringToWasm0(
        arg0,
        wasm.__wbindgen_malloc,
        wasm.__wbindgen_realloc,
      );
    var len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_dunntestresult_note(this.__wbg_ptr, ptr0, len0);
  }
  /**
   * Multiple comparison correction method used
   * @returns {string}
   */
  get correction_method() {
    let deferred1_0;
    let deferred1_1;
    try {
      const ret = wasm.__wbg_get_tukeyhsdtestresult_correction_method(
        this.__wbg_ptr,
      );
      deferred1_0 = ret[0];
      deferred1_1 = ret[1];
      return getStringFromWasm0(ret[0], ret[1]);
    } finally {
      wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
  }
  /**
   * Multiple comparison correction method used
   * @param {string} arg0
   */
  set correction_method(arg0) {
    const ptr0 = passStringToWasm0(
      arg0,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_dunntestresult_correction_method(this.__wbg_ptr, ptr0, len0);
  }
  /**
   * Number of groups compared
   * @returns {number}
   */
  get n_groups() {
    const ret = wasm.__wbg_get_dunntestresult_n_groups(this.__wbg_ptr);
    return ret >>> 0;
  }
  /**
   * Number of groups compared
   * @param {number} arg0
   */
  set n_groups(arg0) {
    wasm.__wbg_set_dunntestresult_n_groups(this.__wbg_ptr, arg0);
  }
  /**
   * Total sample size
   * @returns {number}
   */
  get n_total() {
    const ret = wasm.__wbg_get_dunntestresult_n_total(this.__wbg_ptr);
    return ret >>> 0;
  }
  /**
   * Total sample size
   * @param {number} arg0
   */
  set n_total(arg0) {
    wasm.__wbg_set_dunntestresult_n_total(this.__wbg_ptr, arg0);
  }
  /**
   * Individual pairwise comparisons
   * @returns {PairwiseComparison[]}
   */
  get comparisons() {
    const ret = wasm.__wbg_get_tukeyhsdtestresult_comparisons(this.__wbg_ptr);
    var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
    return v1;
  }
  /**
   * Individual pairwise comparisons
   * @param {PairwiseComparison[]} arg0
   */
  set comparisons(arg0) {
    const ptr0 = passArrayJsValueToWasm0(arg0, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_dunntestresult_comparisons(this.__wbg_ptr, ptr0, len0);
  }
}

const TwoSampleProportionTestResultFinalization =
  (typeof FinalizationRegistry === "undefined")
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry((ptr) =>
      wasm.__wbg_twosampleproportiontestresult_free(ptr >>> 0, 1)
    );
/**
 * Two-sample proportion test result
 */
export class TwoSampleProportionTestResult {
  static __wrap(ptr) {
    ptr = ptr >>> 0;
    const obj = Object.create(TwoSampleProportionTestResult.prototype);
    obj.__wbg_ptr = ptr;
    TwoSampleProportionTestResultFinalization.register(obj, obj.__wbg_ptr, obj);
    return obj;
  }

  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    TwoSampleProportionTestResultFinalization.unregister(this);
    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_twosampleproportiontestresult_free(ptr, 0);
  }
  /**
   * @returns {TestStatistic}
   */
  get test_statistic() {
    const ret = wasm.__wbg_get_anovatestcomponent_test_statistic(
      this.__wbg_ptr,
    );
    return TestStatistic.__wrap(ret);
  }
  /**
   * @param {TestStatistic} arg0
   */
  set test_statistic(arg0) {
    _assertClass(arg0, TestStatistic);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_anovatestcomponent_test_statistic(this.__wbg_ptr, ptr0);
  }
  /**
   * @returns {number}
   */
  get p_value() {
    const ret = wasm.__wbg_get_dunntestresult_p_value(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set p_value(arg0) {
    wasm.__wbg_set_dunntestresult_p_value(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {string}
   */
  get test_name() {
    let deferred1_0;
    let deferred1_1;
    try {
      const ret = wasm.__wbg_get_twosampleproportiontestresult_test_name(
        this.__wbg_ptr,
      );
      deferred1_0 = ret[0];
      deferred1_1 = ret[1];
      return getStringFromWasm0(ret[0], ret[1]);
    } finally {
      wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
  }
  /**
   * @param {string} arg0
   */
  set test_name(arg0) {
    const ptr0 = passStringToWasm0(
      arg0,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_chisquaregoodnessoffittestresult_test_name(
      this.__wbg_ptr,
      ptr0,
      len0,
    );
  }
  /**
   * @returns {number}
   */
  get alpha() {
    const ret = wasm.__wbg_get_dunntestresult_alpha(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set alpha(arg0) {
    wasm.__wbg_set_dunntestresult_alpha(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {string | undefined}
   */
  get error_message() {
    const ret = wasm.__wbg_get_twosampleproportiontestresult_error_message(
      this.__wbg_ptr,
    );
    let v1;
    if (ret[0] !== 0) {
      v1 = getStringFromWasm0(ret[0], ret[1]).slice();
      wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    }
    return v1;
  }
  /**
   * @param {string | null} [arg0]
   */
  set error_message(arg0) {
    var ptr0 = isLikeNone(arg0)
      ? 0
      : passStringToWasm0(
        arg0,
        wasm.__wbindgen_malloc,
        wasm.__wbindgen_realloc,
      );
    var len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_kruskalwallistestresult_error_message(
      this.__wbg_ptr,
      ptr0,
      len0,
    );
  }
  /**
   * @returns {ConfidenceInterval}
   */
  get confidence_interval() {
    const ret = wasm
      .__wbg_get_onesampleproportiontestresult_confidence_interval(
        this.__wbg_ptr,
      );
    return ConfidenceInterval.__wrap(ret);
  }
  /**
   * @param {ConfidenceInterval} arg0
   */
  set confidence_interval(arg0) {
    _assertClass(arg0, ConfidenceInterval);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_onesampleproportiontestresult_confidence_interval(
      this.__wbg_ptr,
      ptr0,
    );
  }
  /**
   * @returns {number}
   */
  get proportion_difference() {
    const ret = wasm.__wbg_get_anovatestcomponent_mean_square(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set proportion_difference(arg0) {
    wasm.__wbg_set_anovatestcomponent_mean_square(this.__wbg_ptr, arg0);
  }
}

const TwoSampleTTestResultFinalization =
  (typeof FinalizationRegistry === "undefined")
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry((ptr) =>
      wasm.__wbg_twosamplettestresult_free(ptr >>> 0, 1)
    );
/**
 * Two-sample independent t-test result
 */
export class TwoSampleTTestResult {
  static __wrap(ptr) {
    ptr = ptr >>> 0;
    const obj = Object.create(TwoSampleTTestResult.prototype);
    obj.__wbg_ptr = ptr;
    TwoSampleTTestResultFinalization.register(obj, obj.__wbg_ptr, obj);
    return obj;
  }

  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    TwoSampleTTestResultFinalization.unregister(this);
    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_twosamplettestresult_free(ptr, 0);
  }
  /**
   * @returns {TestStatistic}
   */
  get test_statistic() {
    const ret = wasm.__wbg_get_anovatestcomponent_test_statistic(
      this.__wbg_ptr,
    );
    return TestStatistic.__wrap(ret);
  }
  /**
   * @param {TestStatistic} arg0
   */
  set test_statistic(arg0) {
    _assertClass(arg0, TestStatistic);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_anovatestcomponent_test_statistic(this.__wbg_ptr, ptr0);
  }
  /**
   * @returns {number}
   */
  get p_value() {
    const ret = wasm.__wbg_get_anovatestcomponent_p_value(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set p_value(arg0) {
    wasm.__wbg_set_anovatestcomponent_p_value(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {string}
   */
  get test_name() {
    let deferred1_0;
    let deferred1_1;
    try {
      const ret = wasm.__wbg_get_twosamplettestresult_test_name(this.__wbg_ptr);
      deferred1_0 = ret[0];
      deferred1_1 = ret[1];
      return getStringFromWasm0(ret[0], ret[1]);
    } finally {
      wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
  }
  /**
   * @param {string} arg0
   */
  set test_name(arg0) {
    const ptr0 = passStringToWasm0(
      arg0,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_anovatablecomponent_component(this.__wbg_ptr, ptr0, len0);
  }
  /**
   * @returns {number}
   */
  get alpha() {
    const ret = wasm.__wbg_get_anovatestcomponent_degrees_of_freedom(
      this.__wbg_ptr,
    );
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set alpha(arg0) {
    wasm.__wbg_set_anovatestcomponent_degrees_of_freedom(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {string | undefined}
   */
  get error_message() {
    const ret = wasm.__wbg_get_twosamplettestresult_error_message(
      this.__wbg_ptr,
    );
    let v1;
    if (ret[0] !== 0) {
      v1 = getStringFromWasm0(ret[0], ret[1]).slice();
      wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    }
    return v1;
  }
  /**
   * @param {string | null} [arg0]
   */
  set error_message(arg0) {
    var ptr0 = isLikeNone(arg0)
      ? 0
      : passStringToWasm0(
        arg0,
        wasm.__wbindgen_malloc,
        wasm.__wbindgen_realloc,
      );
    var len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_pairedttestresult_error_message(this.__wbg_ptr, ptr0, len0);
  }
  /**
   * @returns {ConfidenceInterval}
   */
  get confidence_interval() {
    const ret = wasm.__wbg_get_kendallcorrelationtestresult_confidence_interval(
      this.__wbg_ptr,
    );
    return ConfidenceInterval.__wrap(ret);
  }
  /**
   * @param {ConfidenceInterval} arg0
   */
  set confidence_interval(arg0) {
    _assertClass(arg0, ConfidenceInterval);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_kendallcorrelationtestresult_confidence_interval(
      this.__wbg_ptr,
      ptr0,
    );
  }
  /**
   * @returns {number}
   */
  get degrees_of_freedom() {
    const ret = wasm.__wbg_get_onesamplettestresult_degrees_of_freedom(
      this.__wbg_ptr,
    );
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set degrees_of_freedom(arg0) {
    wasm.__wbg_set_onesamplettestresult_degrees_of_freedom(
      this.__wbg_ptr,
      arg0,
    );
  }
  /**
   * @returns {EffectSize}
   */
  get effect_size() {
    const ret = wasm.__wbg_get_anovatestcomponent_effect_size(this.__wbg_ptr);
    return EffectSize.__wrap(ret);
  }
  /**
   * @param {EffectSize} arg0
   */
  set effect_size(arg0) {
    _assertClass(arg0, EffectSize);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_anovatestcomponent_effect_size(this.__wbg_ptr, ptr0);
  }
  /**
   * @returns {number}
   */
  get mean_difference() {
    const ret = wasm.__wbg_get_anovatablecomponent_ss(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set mean_difference(arg0) {
    wasm.__wbg_set_anovatablecomponent_ss(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {number}
   */
  get standard_error() {
    const ret = wasm.__wbg_get_anovatablecomponent_df(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set standard_error(arg0) {
    wasm.__wbg_set_anovatablecomponent_df(this.__wbg_ptr, arg0);
  }
}

const TwoSampleZTestResultFinalization =
  (typeof FinalizationRegistry === "undefined")
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry((ptr) =>
      wasm.__wbg_twosampleztestresult_free(ptr >>> 0, 1)
    );
/**
 * Two-sample Z-test result
 */
export class TwoSampleZTestResult {
  static __wrap(ptr) {
    ptr = ptr >>> 0;
    const obj = Object.create(TwoSampleZTestResult.prototype);
    obj.__wbg_ptr = ptr;
    TwoSampleZTestResultFinalization.register(obj, obj.__wbg_ptr, obj);
    return obj;
  }

  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    TwoSampleZTestResultFinalization.unregister(this);
    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_twosampleztestresult_free(ptr, 0);
  }
  /**
   * @returns {TestStatistic}
   */
  get test_statistic() {
    const ret = wasm.__wbg_get_anovatestcomponent_test_statistic(
      this.__wbg_ptr,
    );
    return TestStatistic.__wrap(ret);
  }
  /**
   * @param {TestStatistic} arg0
   */
  set test_statistic(arg0) {
    _assertClass(arg0, TestStatistic);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_anovatestcomponent_test_statistic(this.__wbg_ptr, ptr0);
  }
  /**
   * @returns {number}
   */
  get p_value() {
    const ret = wasm.__wbg_get_anovatestcomponent_p_value(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set p_value(arg0) {
    wasm.__wbg_set_anovatestcomponent_p_value(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {string}
   */
  get test_name() {
    let deferred1_0;
    let deferred1_1;
    try {
      const ret = wasm.__wbg_get_twosampleztestresult_test_name(this.__wbg_ptr);
      deferred1_0 = ret[0];
      deferred1_1 = ret[1];
      return getStringFromWasm0(ret[0], ret[1]);
    } finally {
      wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
  }
  /**
   * @param {string} arg0
   */
  set test_name(arg0) {
    const ptr0 = passStringToWasm0(
      arg0,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_fishersexacttestresult_test_name(this.__wbg_ptr, ptr0, len0);
  }
  /**
   * @returns {number}
   */
  get alpha() {
    const ret = wasm.__wbg_get_anovatestcomponent_degrees_of_freedom(
      this.__wbg_ptr,
    );
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set alpha(arg0) {
    wasm.__wbg_set_anovatestcomponent_degrees_of_freedom(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {string | undefined}
   */
  get error_message() {
    const ret = wasm.__wbg_get_twosampleztestresult_error_message(
      this.__wbg_ptr,
    );
    let v1;
    if (ret[0] !== 0) {
      v1 = getStringFromWasm0(ret[0], ret[1]).slice();
      wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    }
    return v1;
  }
  /**
   * @param {string | null} [arg0]
   */
  set error_message(arg0) {
    var ptr0 = isLikeNone(arg0)
      ? 0
      : passStringToWasm0(
        arg0,
        wasm.__wbindgen_malloc,
        wasm.__wbindgen_realloc,
      );
    var len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_chisquareindependencetestresult_error_message(
      this.__wbg_ptr,
      ptr0,
      len0,
    );
  }
  /**
   * @returns {ConfidenceInterval}
   */
  get confidence_interval() {
    const ret = wasm.__wbg_get_kendallcorrelationtestresult_confidence_interval(
      this.__wbg_ptr,
    );
    return ConfidenceInterval.__wrap(ret);
  }
  /**
   * @param {ConfidenceInterval} arg0
   */
  set confidence_interval(arg0) {
    _assertClass(arg0, ConfidenceInterval);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_kendallcorrelationtestresult_confidence_interval(
      this.__wbg_ptr,
      ptr0,
    );
  }
  /**
   * @returns {EffectSize}
   */
  get effect_size() {
    const ret = wasm.__wbg_get_anovatestcomponent_effect_size(this.__wbg_ptr);
    return EffectSize.__wrap(ret);
  }
  /**
   * @param {EffectSize} arg0
   */
  set effect_size(arg0) {
    _assertClass(arg0, EffectSize);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_anovatestcomponent_effect_size(this.__wbg_ptr, ptr0);
  }
  /**
   * @returns {number}
   */
  get mean_difference() {
    const ret = wasm.__wbg_get_onesamplettestresult_degrees_of_freedom(
      this.__wbg_ptr,
    );
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set mean_difference(arg0) {
    wasm.__wbg_set_onesamplettestresult_degrees_of_freedom(
      this.__wbg_ptr,
      arg0,
    );
  }
  /**
   * @returns {number}
   */
  get standard_error() {
    const ret = wasm.__wbg_get_anovatablecomponent_ss(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set standard_error(arg0) {
    wasm.__wbg_set_anovatablecomponent_ss(this.__wbg_ptr, arg0);
  }
}

const TwoWayAnovaTestResultFinalization =
  (typeof FinalizationRegistry === "undefined")
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry((ptr) =>
      wasm.__wbg_twowayanovatestresult_free(ptr >>> 0, 1)
    );
/**
 * Two-way ANOVA test result with guaranteed properties for all three tests
 */
export class TwoWayAnovaTestResult {
  static __wrap(ptr) {
    ptr = ptr >>> 0;
    const obj = Object.create(TwoWayAnovaTestResult.prototype);
    obj.__wbg_ptr = ptr;
    TwoWayAnovaTestResultFinalization.register(obj, obj.__wbg_ptr, obj);
    return obj;
  }

  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    TwoWayAnovaTestResultFinalization.unregister(this);
    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_twowayanovatestresult_free(ptr, 0);
  }
  /**
   * @returns {AnovaTestComponent}
   */
  get factor_a() {
    const ret = wasm.__wbg_get_twowayanovatestresult_factor_a(this.__wbg_ptr);
    return AnovaTestComponent.__wrap(ret);
  }
  /**
   * @param {AnovaTestComponent} arg0
   */
  set factor_a(arg0) {
    _assertClass(arg0, AnovaTestComponent);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_twowayanovatestresult_factor_a(this.__wbg_ptr, ptr0);
  }
  /**
   * @returns {AnovaTestComponent}
   */
  get factor_b() {
    const ret = wasm.__wbg_get_twowayanovatestresult_factor_b(this.__wbg_ptr);
    return AnovaTestComponent.__wrap(ret);
  }
  /**
   * @param {AnovaTestComponent} arg0
   */
  set factor_b(arg0) {
    _assertClass(arg0, AnovaTestComponent);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_twowayanovatestresult_factor_b(this.__wbg_ptr, ptr0);
  }
  /**
   * @returns {AnovaTestComponent}
   */
  get interaction() {
    const ret = wasm.__wbg_get_twowayanovatestresult_interaction(
      this.__wbg_ptr,
    );
    return AnovaTestComponent.__wrap(ret);
  }
  /**
   * @param {AnovaTestComponent} arg0
   */
  set interaction(arg0) {
    _assertClass(arg0, AnovaTestComponent);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_twowayanovatestresult_interaction(this.__wbg_ptr, ptr0);
  }
  /**
   * @returns {string}
   */
  get test_name() {
    let deferred1_0;
    let deferred1_1;
    try {
      const ret = wasm.__wbg_get_twowayanovatestresult_test_name(
        this.__wbg_ptr,
      );
      deferred1_0 = ret[0];
      deferred1_1 = ret[1];
      return getStringFromWasm0(ret[0], ret[1]);
    } finally {
      wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
  }
  /**
   * @param {string} arg0
   */
  set test_name(arg0) {
    const ptr0 = passStringToWasm0(
      arg0,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_twowayanovatestresult_test_name(this.__wbg_ptr, ptr0, len0);
  }
  /**
   * @returns {number}
   */
  get alpha() {
    const ret = wasm.__wbg_get_twowayanovatestresult_alpha(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set alpha(arg0) {
    wasm.__wbg_set_twowayanovatestresult_alpha(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {string | undefined}
   */
  get error_message() {
    const ret = wasm.__wbg_get_twowayanovatestresult_error_message(
      this.__wbg_ptr,
    );
    let v1;
    if (ret[0] !== 0) {
      v1 = getStringFromWasm0(ret[0], ret[1]).slice();
      wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    }
    return v1;
  }
  /**
   * @param {string | null} [arg0]
   */
  set error_message(arg0) {
    var ptr0 = isLikeNone(arg0)
      ? 0
      : passStringToWasm0(
        arg0,
        wasm.__wbindgen_malloc,
        wasm.__wbindgen_realloc,
      );
    var len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_twowayanovatestresult_error_message(
      this.__wbg_ptr,
      ptr0,
      len0,
    );
  }
  /**
   * @returns {number}
   */
  get sample_size() {
    const ret = wasm.__wbg_get_twowayanovatestresult_sample_size(
      this.__wbg_ptr,
    );
    return ret >>> 0;
  }
  /**
   * @param {number} arg0
   */
  set sample_size(arg0) {
    wasm.__wbg_set_twowayanovatestresult_sample_size(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {Float64Array}
   */
  get sample_means() {
    const ret = wasm.__wbg_get_twowayanovatestresult_sample_means(
      this.__wbg_ptr,
    );
    var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v1;
  }
  /**
   * @param {Float64Array} arg0
   */
  set sample_means(arg0) {
    const ptr0 = passArrayF64ToWasm0(arg0, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_twowayanovatestresult_sample_means(
      this.__wbg_ptr,
      ptr0,
      len0,
    );
  }
  /**
   * @returns {Float64Array}
   */
  get sample_std_devs() {
    const ret = wasm.__wbg_get_twowayanovatestresult_sample_std_devs(
      this.__wbg_ptr,
    );
    var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v1;
  }
  /**
   * @param {Float64Array} arg0
   */
  set sample_std_devs(arg0) {
    const ptr0 = passArrayF64ToWasm0(arg0, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_twowayanovatestresult_sample_std_devs(
      this.__wbg_ptr,
      ptr0,
      len0,
    );
  }
  /**
   * @returns {Float64Array}
   */
  get sum_of_squares() {
    const ret = wasm.__wbg_get_twowayanovatestresult_sum_of_squares(
      this.__wbg_ptr,
    );
    var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v1;
  }
  /**
   * @param {Float64Array} arg0
   */
  set sum_of_squares(arg0) {
    const ptr0 = passArrayF64ToWasm0(arg0, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_twowayanovatestresult_sum_of_squares(
      this.__wbg_ptr,
      ptr0,
      len0,
    );
  }
  /**
   * @returns {number}
   */
  get grand_mean() {
    const ret = wasm.__wbg_get_twowayanovatestresult_grand_mean(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set grand_mean(arg0) {
    wasm.__wbg_set_twowayanovatestresult_grand_mean(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {number}
   */
  get r_squared() {
    const ret = wasm.__wbg_get_twowayanovatestresult_r_squared(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set r_squared(arg0) {
    wasm.__wbg_set_twowayanovatestresult_r_squared(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {AnovaTableComponent[]}
   */
  get anova_table() {
    const ret = wasm.__wbg_get_twowayanovatestresult_anova_table(
      this.__wbg_ptr,
    );
    var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
    return v1;
  }
  /**
   * @param {AnovaTableComponent[]} arg0
   */
  set anova_table(arg0) {
    const ptr0 = passArrayJsValueToWasm0(arg0, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_twowayanovatestresult_anova_table(
      this.__wbg_ptr,
      ptr0,
      len0,
    );
  }
  /**
   * @returns {number}
   */
  get df_error() {
    const ret = wasm.__wbg_get_twowayanovatestresult_df_error(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set df_error(arg0) {
    wasm.__wbg_set_twowayanovatestresult_df_error(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {number}
   */
  get ms_error() {
    const ret = wasm.__wbg_get_twowayanovatestresult_ms_error(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set ms_error(arg0) {
    wasm.__wbg_set_twowayanovatestresult_ms_error(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {number}
   */
  get df_total() {
    const ret = wasm.__wbg_get_twowayanovatestresult_df_total(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set df_total(arg0) {
    wasm.__wbg_set_twowayanovatestresult_df_total(this.__wbg_ptr, arg0);
  }
}

const WelchAnovaTestResultFinalization =
  (typeof FinalizationRegistry === "undefined")
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry((ptr) =>
      wasm.__wbg_welchanovatestresult_free(ptr >>> 0, 1)
    );
/**
 * Welch's ANOVA test result with proper two degrees of freedom
 */
export class WelchAnovaTestResult {
  static __wrap(ptr) {
    ptr = ptr >>> 0;
    const obj = Object.create(WelchAnovaTestResult.prototype);
    obj.__wbg_ptr = ptr;
    WelchAnovaTestResultFinalization.register(obj, obj.__wbg_ptr, obj);
    return obj;
  }

  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    WelchAnovaTestResultFinalization.unregister(this);
    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_welchanovatestresult_free(ptr, 0);
  }
  /**
   * @returns {TestStatistic}
   */
  get test_statistic() {
    const ret = wasm.__wbg_get_anovatestcomponent_test_statistic(
      this.__wbg_ptr,
    );
    return TestStatistic.__wrap(ret);
  }
  /**
   * @param {TestStatistic} arg0
   */
  set test_statistic(arg0) {
    _assertClass(arg0, TestStatistic);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_anovatestcomponent_test_statistic(this.__wbg_ptr, ptr0);
  }
  /**
   * @returns {number}
   */
  get p_value() {
    const ret = wasm.__wbg_get_anovatestcomponent_p_value(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set p_value(arg0) {
    wasm.__wbg_set_anovatestcomponent_p_value(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {string}
   */
  get test_name() {
    let deferred1_0;
    let deferred1_1;
    try {
      const ret = wasm.__wbg_get_welchanovatestresult_test_name(this.__wbg_ptr);
      deferred1_0 = ret[0];
      deferred1_1 = ret[1];
      return getStringFromWasm0(ret[0], ret[1]);
    } finally {
      wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
  }
  /**
   * @param {string} arg0
   */
  set test_name(arg0) {
    const ptr0 = passStringToWasm0(
      arg0,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_chisquarevariancetestresult_test_name(
      this.__wbg_ptr,
      ptr0,
      len0,
    );
  }
  /**
   * @returns {number}
   */
  get alpha() {
    const ret = wasm.__wbg_get_anovatestcomponent_degrees_of_freedom(
      this.__wbg_ptr,
    );
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set alpha(arg0) {
    wasm.__wbg_set_anovatestcomponent_degrees_of_freedom(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {string | undefined}
   */
  get error_message() {
    const ret = wasm.__wbg_get_welchanovatestresult_error_message(
      this.__wbg_ptr,
    );
    let v1;
    if (ret[0] !== 0) {
      v1 = getStringFromWasm0(ret[0], ret[1]).slice();
      wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    }
    return v1;
  }
  /**
   * @param {string | null} [arg0]
   */
  set error_message(arg0) {
    var ptr0 = isLikeNone(arg0)
      ? 0
      : passStringToWasm0(
        arg0,
        wasm.__wbindgen_malloc,
        wasm.__wbindgen_realloc,
      );
    var len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_welchanovatestresult_error_message(
      this.__wbg_ptr,
      ptr0,
      len0,
    );
  }
  /**
   * @returns {number}
   */
  get df1() {
    const ret = wasm.__wbg_get_anovatestcomponent_mean_square(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set df1(arg0) {
    wasm.__wbg_set_anovatestcomponent_mean_square(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {number}
   */
  get df2() {
    const ret = wasm.__wbg_get_anovatestcomponent_sum_of_squares(
      this.__wbg_ptr,
    );
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set df2(arg0) {
    wasm.__wbg_set_anovatestcomponent_sum_of_squares(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {EffectSize}
   */
  get effect_size() {
    const ret = wasm.__wbg_get_anovatestcomponent_effect_size(this.__wbg_ptr);
    return EffectSize.__wrap(ret);
  }
  /**
   * @param {EffectSize} arg0
   */
  set effect_size(arg0) {
    _assertClass(arg0, EffectSize);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_anovatestcomponent_effect_size(this.__wbg_ptr, ptr0);
  }
  /**
   * @returns {number}
   */
  get sample_size() {
    const ret = wasm.__wbg_get_welchanovatestresult_sample_size(this.__wbg_ptr);
    return ret >>> 0;
  }
  /**
   * @param {number} arg0
   */
  set sample_size(arg0) {
    wasm.__wbg_set_welchanovatestresult_sample_size(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {number}
   */
  get r_squared() {
    const ret = wasm.__wbg_get_onewayanovatestresult_adjusted_r_squared(
      this.__wbg_ptr,
    );
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set r_squared(arg0) {
    wasm.__wbg_set_onewayanovatestresult_adjusted_r_squared(
      this.__wbg_ptr,
      arg0,
    );
  }
  /**
   * @returns {number}
   */
  get adjusted_r_squared() {
    const ret = wasm.__wbg_get_onesamplettestresult_degrees_of_freedom(
      this.__wbg_ptr,
    );
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set adjusted_r_squared(arg0) {
    wasm.__wbg_set_onesamplettestresult_degrees_of_freedom(
      this.__wbg_ptr,
      arg0,
    );
  }
  /**
   * @returns {Float64Array}
   */
  get sample_means() {
    const ret = wasm.__wbg_get_welchanovatestresult_sample_means(
      this.__wbg_ptr,
    );
    var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v1;
  }
  /**
   * @param {Float64Array} arg0
   */
  set sample_means(arg0) {
    const ptr0 = passArrayF64ToWasm0(arg0, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_welchanovatestresult_sample_means(
      this.__wbg_ptr,
      ptr0,
      len0,
    );
  }
  /**
   * @returns {Float64Array}
   */
  get sample_std_devs() {
    const ret = wasm.__wbg_get_welchanovatestresult_sample_std_devs(
      this.__wbg_ptr,
    );
    var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v1;
  }
  /**
   * @param {Float64Array} arg0
   */
  set sample_std_devs(arg0) {
    const ptr0 = passArrayF64ToWasm0(arg0, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_welchanovatestresult_sample_std_devs(
      this.__wbg_ptr,
      ptr0,
      len0,
    );
  }
}

const WilcoxonSignedRankTestResultFinalization =
  (typeof FinalizationRegistry === "undefined")
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry((ptr) =>
      wasm.__wbg_wilcoxonsignedranktestresult_free(ptr >>> 0, 1)
    );
/**
 * Wilcoxon signed-rank test result with method information
 */
export class WilcoxonSignedRankTestResult {
  static __wrap(ptr) {
    ptr = ptr >>> 0;
    const obj = Object.create(WilcoxonSignedRankTestResult.prototype);
    obj.__wbg_ptr = ptr;
    WilcoxonSignedRankTestResultFinalization.register(obj, obj.__wbg_ptr, obj);
    return obj;
  }

  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    WilcoxonSignedRankTestResultFinalization.unregister(this);
    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_wilcoxonsignedranktestresult_free(ptr, 0);
  }
  /**
   * @returns {TestStatistic}
   */
  get test_statistic() {
    const ret = wasm.__wbg_get_anovatestcomponent_test_statistic(
      this.__wbg_ptr,
    );
    return TestStatistic.__wrap(ret);
  }
  /**
   * @param {TestStatistic} arg0
   */
  set test_statistic(arg0) {
    _assertClass(arg0, TestStatistic);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_anovatestcomponent_test_statistic(this.__wbg_ptr, ptr0);
  }
  /**
   * @returns {number}
   */
  get p_value() {
    const ret = wasm.__wbg_get_anovatestcomponent_p_value(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set p_value(arg0) {
    wasm.__wbg_set_anovatestcomponent_p_value(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {string}
   */
  get test_name() {
    let deferred1_0;
    let deferred1_1;
    try {
      const ret = wasm.__wbg_get_wilcoxonsignedranktestresult_test_name(
        this.__wbg_ptr,
      );
      deferred1_0 = ret[0];
      deferred1_1 = ret[1];
      return getStringFromWasm0(ret[0], ret[1]);
    } finally {
      wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
  }
  /**
   * @param {string} arg0
   */
  set test_name(arg0) {
    const ptr0 = passStringToWasm0(
      arg0,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_mannwhitneytestresult_test_name(this.__wbg_ptr, ptr0, len0);
  }
  /**
   * @returns {string}
   */
  get method() {
    let deferred1_0;
    let deferred1_1;
    try {
      const ret = wasm.__wbg_get_wilcoxonsignedranktestresult_method(
        this.__wbg_ptr,
      );
      deferred1_0 = ret[0];
      deferred1_1 = ret[1];
      return getStringFromWasm0(ret[0], ret[1]);
    } finally {
      wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
  }
  /**
   * @param {string} arg0
   */
  set method(arg0) {
    const ptr0 = passStringToWasm0(
      arg0,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_mannwhitneytestresult_method(this.__wbg_ptr, ptr0, len0);
  }
  /**
   * @returns {number}
   */
  get alpha() {
    const ret = wasm.__wbg_get_anovatestcomponent_degrees_of_freedom(
      this.__wbg_ptr,
    );
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set alpha(arg0) {
    wasm.__wbg_set_anovatestcomponent_degrees_of_freedom(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {string | undefined}
   */
  get error_message() {
    const ret = wasm.__wbg_get_wilcoxonsignedranktestresult_error_message(
      this.__wbg_ptr,
    );
    let v1;
    if (ret[0] !== 0) {
      v1 = getStringFromWasm0(ret[0], ret[1]).slice();
      wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    }
    return v1;
  }
  /**
   * @param {string | null} [arg0]
   */
  set error_message(arg0) {
    var ptr0 = isLikeNone(arg0)
      ? 0
      : passStringToWasm0(
        arg0,
        wasm.__wbindgen_malloc,
        wasm.__wbindgen_realloc,
      );
    var len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_dunntestresult_note(this.__wbg_ptr, ptr0, len0);
  }
  /**
   * @returns {EffectSize}
   */
  get effect_size() {
    const ret = wasm.__wbg_get_anovatestcomponent_effect_size(this.__wbg_ptr);
    return EffectSize.__wrap(ret);
  }
  /**
   * @param {EffectSize} arg0
   */
  set effect_size(arg0) {
    _assertClass(arg0, EffectSize);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_anovatestcomponent_effect_size(this.__wbg_ptr, ptr0);
  }
}

export function __wbg_anovatablecomponent_new(arg0) {
  const ret = AnovaTableComponent.__wrap(arg0);
  return ret;
}

export function __wbg_anovatablecomponent_unwrap(arg0) {
  const ret = AnovaTableComponent.__unwrap(arg0);
  return ret;
}

export function __wbg_buffer_609cc3eee51ed158(arg0) {
  const ret = arg0.buffer;
  return ret;
}

export function __wbg_call_672a4d21634d4a24() {
  return handleError(function (arg0, arg1) {
    const ret = arg0.call(arg1);
    return ret;
  }, arguments);
}

export function __wbg_call_7cccdd69e0791ae2() {
  return handleError(function (arg0, arg1, arg2) {
    const ret = arg0.call(arg1, arg2);
    return ret;
  }, arguments);
}

export function __wbg_crypto_574e78ad8b13b65f(arg0) {
  const ret = arg0.crypto;
  return ret;
}

export function __wbg_getRandomValues_b8f5dbd5f3995a9e() {
  return handleError(function (arg0, arg1) {
    arg0.getRandomValues(arg1);
  }, arguments);
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

export function __wbg_log_c222819a41e063d3(arg0) {
  console.log(arg0);
}

export function __wbg_msCrypto_a61aeb35a24c1329(arg0) {
  const ret = arg0.msCrypto;
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

export function __wbg_newnoargs_105ed471475aaf50(arg0, arg1) {
  const ret = new Function(getStringFromWasm0(arg0, arg1));
  return ret;
}

export function __wbg_newwithbyteoffsetandlength_d97e637ebe145a9a(
  arg0,
  arg1,
  arg2,
) {
  const ret = new Uint8Array(arg0, arg1 >>> 0, arg2 >>> 0);
  return ret;
}

export function __wbg_newwithlength_a381634e90c276d4(arg0) {
  const ret = new Uint8Array(arg0 >>> 0);
  return ret;
}

export function __wbg_node_905d3e251edff8a2(arg0) {
  const ret = arg0.node;
  return ret;
}

export function __wbg_pairwisecomparison_new(arg0) {
  const ret = PairwiseComparison.__wrap(arg0);
  return ret;
}

export function __wbg_pairwisecomparison_unwrap(arg0) {
  const ret = PairwiseComparison.__unwrap(arg0);
  return ret;
}

export function __wbg_process_dc0fbacc7c1c06f7(arg0) {
  const ret = arg0.process;
  return ret;
}

export function __wbg_randomFillSync_ac0988aba3254290() {
  return handleError(function (arg0, arg1) {
    arg0.randomFillSync(arg1);
  }, arguments);
}

export function __wbg_require_60cc747a6bc5215a() {
  return handleError(function () {
    const ret = module.require;
    return ret;
  }, arguments);
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

export function __wbg_static_accessor_GLOBAL_88a902d13a557d07() {
  const ret = typeof global === "undefined" ? null : global;
  return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
}

export function __wbg_static_accessor_GLOBAL_THIS_56578be7e9f832b0() {
  const ret = typeof globalThis === "undefined" ? null : globalThis;
  return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
}

export function __wbg_static_accessor_SELF_37c5d418e4bf5819() {
  const ret = typeof self === "undefined" ? null : self;
  return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
}

export function __wbg_static_accessor_WINDOW_5de37043a91a9c40() {
  const ret = typeof window === "undefined" ? null : window;
  return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
}

export function __wbg_subarray_aa9065fa9dc5df96(arg0, arg1, arg2) {
  const ret = arg0.subarray(arg1 >>> 0, arg2 >>> 0);
  return ret;
}

export function __wbg_versions_c01dfd4722a88165(arg0) {
  const ret = arg0.versions;
  return ret;
}

export function __wbindgen_copy_to_typed_array(arg0, arg1, arg2) {
  new Uint8Array(arg2.buffer, arg2.byteOffset, arg2.byteLength).set(
    getArrayU8FromWasm0(arg0, arg1),
  );
}

export function __wbindgen_init_externref_table() {
  const table = wasm.__wbindgen_export_2;
  const offset = table.grow(4);
  table.set(0, undefined);
  table.set(offset + 0, undefined);
  table.set(offset + 1, null);
  table.set(offset + 2, true);
  table.set(offset + 3, false);
}

export function __wbindgen_is_function(arg0) {
  const ret = typeof arg0 === "function";
  return ret;
}

export function __wbindgen_is_object(arg0) {
  const val = arg0;
  const ret = typeof val === "object" && val !== null;
  return ret;
}

export function __wbindgen_is_string(arg0) {
  const ret = typeof arg0 === "string";
  return ret;
}

export function __wbindgen_is_undefined(arg0) {
  const ret = arg0 === undefined;
  return ret;
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
