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
 * WASM export for one-way ANOVA
 * @param {Float64Array} data
 * @param {Uint32Array} group_sizes
 * @param {number} alpha
 * @returns {TestResult}
 */
export function anova_one_way(data, group_sizes, alpha) {
  const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passArray32ToWasm0(group_sizes, wasm.__wbindgen_malloc);
  const len1 = WASM_VECTOR_LEN;
  const ret = wasm.anova_one_way(ptr0, len0, ptr1, len1, alpha);
  return TestResult.__wrap(ret);
}

/**
 * WASM export for two-way ANOVA factor A
 * @param {Float64Array} data
 * @param {number} a_levels
 * @param {number} b_levels
 * @param {Uint32Array} cell_sizes
 * @param {number} alpha
 * @returns {TestResult}
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
  return TestResult.__wrap(ret);
}

/**
 * WASM export for two-way ANOVA factor B
 * @param {Float64Array} data
 * @param {number} a_levels
 * @param {number} b_levels
 * @param {Uint32Array} cell_sizes
 * @param {number} alpha
 * @returns {TestResult}
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
  return TestResult.__wrap(ret);
}

/**
 * WASM export for two-way ANOVA interaction
 * @param {Float64Array} data
 * @param {number} a_levels
 * @param {number} b_levels
 * @param {Uint32Array} cell_sizes
 * @param {number} alpha
 * @returns {TestResult}
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
  return TestResult.__wrap(ret);
}

/**
 * WASM export for two-way ANOVA
 * Takes flattened data with group information to reconstruct 2D factorial design
 * @param {Float64Array} data
 * @param {number} a_levels
 * @param {number} b_levels
 * @param {Uint32Array} cell_sizes
 * @param {number} alpha
 * @returns {TestResult}
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
  return TestResult.__wrap(ret);
}

/**
 * WASM export for chi-square test of independence
 * @param {Float64Array} observed
 * @param {number} rows
 * @param {number} cols
 * @param {number} alpha
 * @returns {TestResult}
 */
export function chi_square_independence(observed, rows, cols, alpha) {
  const ptr0 = passArrayF64ToWasm0(observed, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ret = wasm.chi_square_independence(ptr0, len0, rows, cols, alpha);
  return TestResult.__wrap(ret);
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
 * @returns {TestResult}
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
  return TestResult.__wrap(ret);
}

/**
 * @param {Float64Array} x
 * @param {Float64Array} y
 * @param {string} alternative
 * @param {number} alpha
 * @returns {TestResult}
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
  return TestResult.__wrap(ret);
}

/**
 * @param {Float64Array} x
 * @param {Float64Array} y
 * @param {string} alternative
 * @param {number} alpha
 * @returns {TestResult}
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
  return TestResult.__wrap(ret);
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
 * @returns {TestResult}
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
  return TestResult.__wrap(ret);
}

/**
 * WASM export for Kruskal-Wallis test
 * @param {Float64Array} data
 * @param {Uint32Array} group_sizes
 * @param {number} alpha
 * @returns {TestResult}
 */
export function kruskal_wallis_test_wasm(data, group_sizes, alpha) {
  const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passArray32ToWasm0(group_sizes, wasm.__wbindgen_malloc);
  const len1 = WASM_VECTOR_LEN;
  const ret = wasm.kruskal_wallis_test_wasm(ptr0, len0, ptr1, len1, alpha);
  return TestResult.__wrap(ret);
}

/**
 * WASM export for Mann-Whitney U test
 * @param {Float64Array} x
 * @param {Float64Array} y
 * @param {number} alpha
 * @param {string} alternative
 * @returns {TestResult}
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
  return TestResult.__wrap(ret);
}

/**
 * WASM export for Mann-Whitney U test with configuration
 * @param {Float64Array} x
 * @param {Float64Array} y
 * @param {boolean} exact
 * @param {boolean} continuity_correction
 * @param {number} alpha
 * @param {string} alternative
 * @returns {TestResult}
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
  return TestResult.__wrap(ret);
}

/**
 * WASM export for one-sample proportion test
 * @param {number} x
 * @param {number} n
 * @param {number} p0
 * @param {number} alpha
 * @param {string} alternative
 * @returns {TestResult}
 */
export function proportion_test_one_sample(x, n, p0, alpha, alternative) {
  const ptr0 = passStringToWasm0(
    alternative,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len0 = WASM_VECTOR_LEN;
  const ret = wasm.proportion_test_one_sample(x, n, p0, alpha, ptr0, len0);
  return TestResult.__wrap(ret);
}

/**
 * WASM export for two-sample proportion test
 * @param {number} x1
 * @param {number} n1
 * @param {number} x2
 * @param {number} n2
 * @param {number} alpha
 * @param {string} alternative
 * @param {boolean} pooled
 * @returns {TestResult}
 */
export function proportion_test_two_sample(
  x1,
  n1,
  x2,
  n2,
  alpha,
  alternative,
  pooled,
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
    pooled,
  );
  return TestResult.__wrap(ret);
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
 * @returns {TestResult}
 */
export function shapiro_wilk_test(x, alpha) {
  const ptr0 = passArrayF64ToWasm0(x, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ret = wasm.shapiro_wilk_test(ptr0, len0, alpha);
  return TestResult.__wrap(ret);
}

/**
 * WASM export for one-sample t-test
 * @param {Float64Array} x
 * @param {number} mu
 * @param {number} alpha
 * @param {string} alternative
 * @returns {TestResult}
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
  return TestResult.__wrap(ret);
}

/**
 * WASM export for independent two-sample t-test
 * @param {Float64Array} x
 * @param {Float64Array} y
 * @param {number} alpha
 * @param {string} alternative
 * @param {boolean} pooled
 * @returns {TestResult}
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
  return TestResult.__wrap(ret);
}

/**
 * WASM export for paired t-test
 * @param {Float64Array} x
 * @param {Float64Array} y
 * @param {number} alpha
 * @param {string} alternative
 * @returns {TestResult}
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
  return TestResult.__wrap(ret);
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
 * @returns {TestResult}
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
  return TestResult.__wrap(ret);
}

/**
 * WASM export for one-sample z-test
 * @param {Float64Array} x
 * @param {number} mu
 * @param {number} sigma
 * @param {number} alpha
 * @param {string} alternative
 * @returns {TestResult}
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
  return TestResult.__wrap(ret);
}

/**
 * WASM export for two-sample z-test
 * @param {Float64Array} x
 * @param {Float64Array} y
 * @param {number} sigma_x
 * @param {number} sigma_y
 * @param {number} alpha
 * @param {string} alternative
 * @returns {TestResult}
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
  return TestResult.__wrap(ret);
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
 * Represents the type of statistical test performed.
 * @enum {0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18}
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
  OneSampleZTest: 10,
  "10": "OneSampleZTest",
  TwoSampleZTest: 11,
  "11": "TwoSampleZTest",
  OneSampleProportionTest: 12,
  "12": "OneSampleProportionTest",
  TwoSampleProportionTest: 13,
  "13": "TwoSampleProportionTest",
  ShapiroWilk: 14,
  "14": "ShapiroWilk",
  PearsonCorrelation: 15,
  "15": "PearsonCorrelation",
  SpearmanCorrelation: 16,
  "16": "SpearmanCorrelation",
  KendallCorrelation: 17,
  "17": "KendallCorrelation",
  Error: 18,
  "18": "Error",
});

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

const TestResultFinalization = (typeof FinalizationRegistry === "undefined")
  ? { register: () => {}, unregister: () => {} }
  : new FinalizationRegistry((ptr) => wasm.__wbg_testresult_free(ptr >>> 0, 1));
/**
 * Result of a statistical test containing all relevant information
 */
export class TestResult {
  static __wrap(ptr) {
    ptr = ptr >>> 0;
    const obj = Object.create(TestResult.prototype);
    obj.__wbg_ptr = ptr;
    TestResultFinalization.register(obj, obj.__wbg_ptr, obj);
    return obj;
  }

  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    TestResultFinalization.unregister(this);
    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_testresult_free(ptr, 0);
  }
  /**
   * Type of statistical test performed
   * @returns {TestType}
   */
  get test_type() {
    const ret = wasm.__wbg_get_testresult_test_type(this.__wbg_ptr);
    return ret;
  }
  /**
   * Type of statistical test performed
   * @param {TestType} arg0
   */
  set test_type(arg0) {
    wasm.__wbg_set_testresult_test_type(this.__wbg_ptr, arg0);
  }
  /**
   * The calculated test statistic value
   * @returns {number | undefined}
   */
  get test_statistic() {
    const ret = wasm.__wbg_get_testresult_test_statistic(this.__wbg_ptr);
    return ret[0] === 0 ? undefined : ret[1];
  }
  /**
   * The calculated test statistic value
   * @param {number | null} [arg0]
   */
  set test_statistic(arg0) {
    wasm.__wbg_set_testresult_test_statistic(
      this.__wbg_ptr,
      !isLikeNone(arg0),
      isLikeNone(arg0) ? 0 : arg0,
    );
  }
  /**
   * The p-value of the test
   * @returns {number | undefined}
   */
  get p_value() {
    const ret = wasm.__wbg_get_testresult_p_value(this.__wbg_ptr);
    return ret[0] === 0 ? undefined : ret[1];
  }
  /**
   * The p-value of the test
   * @param {number | null} [arg0]
   */
  set p_value(arg0) {
    wasm.__wbg_set_testresult_p_value(
      this.__wbg_ptr,
      !isLikeNone(arg0),
      isLikeNone(arg0) ? 0 : arg0,
    );
  }
  /**
   * Confidence interval lower bound
   * @returns {number | undefined}
   */
  get confidence_interval_lower() {
    const ret = wasm.__wbg_get_testresult_confidence_interval_lower(
      this.__wbg_ptr,
    );
    return ret[0] === 0 ? undefined : ret[1];
  }
  /**
   * Confidence interval lower bound
   * @param {number | null} [arg0]
   */
  set confidence_interval_lower(arg0) {
    wasm.__wbg_set_testresult_confidence_interval_lower(
      this.__wbg_ptr,
      !isLikeNone(arg0),
      isLikeNone(arg0) ? 0 : arg0,
    );
  }
  /**
   * Confidence interval upper bound
   * @returns {number | undefined}
   */
  get confidence_interval_upper() {
    const ret = wasm.__wbg_get_testresult_confidence_interval_upper(
      this.__wbg_ptr,
    );
    return ret[0] === 0 ? undefined : ret[1];
  }
  /**
   * Confidence interval upper bound
   * @param {number | null} [arg0]
   */
  set confidence_interval_upper(arg0) {
    wasm.__wbg_set_testresult_confidence_interval_upper(
      this.__wbg_ptr,
      !isLikeNone(arg0),
      isLikeNone(arg0) ? 0 : arg0,
    );
  }
  /**
   * Confidence level used (e.g., 0.95 for 95%)
   * @returns {number | undefined}
   */
  get confidence_level() {
    const ret = wasm.__wbg_get_testresult_confidence_level(this.__wbg_ptr);
    return ret[0] === 0 ? undefined : ret[1];
  }
  /**
   * Confidence level used (e.g., 0.95 for 95%)
   * @param {number | null} [arg0]
   */
  set confidence_level(arg0) {
    wasm.__wbg_set_testresult_confidence_level(
      this.__wbg_ptr,
      !isLikeNone(arg0),
      isLikeNone(arg0) ? 0 : arg0,
    );
  }
  /**
   * General effect size measure
   * @returns {number | undefined}
   */
  get effect_size() {
    const ret = wasm.__wbg_get_testresult_effect_size(this.__wbg_ptr);
    return ret[0] === 0 ? undefined : ret[1];
  }
  /**
   * General effect size measure
   * @param {number | null} [arg0]
   */
  set effect_size(arg0) {
    wasm.__wbg_set_testresult_effect_size(
      this.__wbg_ptr,
      !isLikeNone(arg0),
      isLikeNone(arg0) ? 0 : arg0,
    );
  }
  /**
   * Cohen's d (for t-tests)
   * @returns {number | undefined}
   */
  get cohens_d() {
    const ret = wasm.__wbg_get_testresult_cohens_d(this.__wbg_ptr);
    return ret[0] === 0 ? undefined : ret[1];
  }
  /**
   * Cohen's d (for t-tests)
   * @param {number | null} [arg0]
   */
  set cohens_d(arg0) {
    wasm.__wbg_set_testresult_cohens_d(
      this.__wbg_ptr,
      !isLikeNone(arg0),
      isLikeNone(arg0) ? 0 : arg0,
    );
  }
  /**
   * Eta squared (for ANOVA)
   * @returns {number | undefined}
   */
  get eta_squared() {
    const ret = wasm.__wbg_get_testresult_eta_squared(this.__wbg_ptr);
    return ret[0] === 0 ? undefined : ret[1];
  }
  /**
   * Eta squared (for ANOVA)
   * @param {number | null} [arg0]
   */
  set eta_squared(arg0) {
    wasm.__wbg_set_testresult_eta_squared(
      this.__wbg_ptr,
      !isLikeNone(arg0),
      isLikeNone(arg0) ? 0 : arg0,
    );
  }
  /**
   * Cramer's V (for chi-square)
   * @returns {number | undefined}
   */
  get cramers_v() {
    const ret = wasm.__wbg_get_testresult_cramers_v(this.__wbg_ptr);
    return ret[0] === 0 ? undefined : ret[1];
  }
  /**
   * Cramer's V (for chi-square)
   * @param {number | null} [arg0]
   */
  set cramers_v(arg0) {
    wasm.__wbg_set_testresult_cramers_v(
      this.__wbg_ptr,
      !isLikeNone(arg0),
      isLikeNone(arg0) ? 0 : arg0,
    );
  }
  /**
   * Phi coefficient (for 2x2 chi-square)
   * @returns {number | undefined}
   */
  get phi_coefficient() {
    const ret = wasm.__wbg_get_testresult_phi_coefficient(this.__wbg_ptr);
    return ret[0] === 0 ? undefined : ret[1];
  }
  /**
   * Phi coefficient (for 2x2 chi-square)
   * @param {number | null} [arg0]
   */
  set phi_coefficient(arg0) {
    wasm.__wbg_set_testresult_phi_coefficient(
      this.__wbg_ptr,
      !isLikeNone(arg0),
      isLikeNone(arg0) ? 0 : arg0,
    );
  }
  /**
   * Odds ratio (for categorical tests)
   * @returns {number | undefined}
   */
  get odds_ratio() {
    const ret = wasm.__wbg_get_testresult_odds_ratio(this.__wbg_ptr);
    return ret[0] === 0 ? undefined : ret[1];
  }
  /**
   * Odds ratio (for categorical tests)
   * @param {number | null} [arg0]
   */
  set odds_ratio(arg0) {
    wasm.__wbg_set_testresult_odds_ratio(
      this.__wbg_ptr,
      !isLikeNone(arg0),
      isLikeNone(arg0) ? 0 : arg0,
    );
  }
  /**
   * Relative risk (for categorical tests)
   * @returns {number | undefined}
   */
  get relative_risk() {
    const ret = wasm.__wbg_get_testresult_relative_risk(this.__wbg_ptr);
    return ret[0] === 0 ? undefined : ret[1];
  }
  /**
   * Relative risk (for categorical tests)
   * @param {number | null} [arg0]
   */
  set relative_risk(arg0) {
    wasm.__wbg_set_testresult_relative_risk(
      this.__wbg_ptr,
      !isLikeNone(arg0),
      isLikeNone(arg0) ? 0 : arg0,
    );
  }
  /**
   * Degrees of freedom
   * @returns {number | undefined}
   */
  get degrees_of_freedom() {
    const ret = wasm.__wbg_get_testresult_degrees_of_freedom(this.__wbg_ptr);
    return ret[0] === 0 ? undefined : ret[1];
  }
  /**
   * Degrees of freedom
   * @param {number | null} [arg0]
   */
  set degrees_of_freedom(arg0) {
    wasm.__wbg_set_testresult_degrees_of_freedom(
      this.__wbg_ptr,
      !isLikeNone(arg0),
      isLikeNone(arg0) ? 0 : arg0,
    );
  }
  /**
   * Sample size
   * @returns {number | undefined}
   */
  get sample_size() {
    const ret = wasm.__wbg_get_testresult_sample_size(this.__wbg_ptr);
    return ret === 0x100000001 ? undefined : ret;
  }
  /**
   * Sample size
   * @param {number | null} [arg0]
   */
  set sample_size(arg0) {
    wasm.__wbg_set_testresult_sample_size(
      this.__wbg_ptr,
      isLikeNone(arg0) ? 0x100000001 : arg0 >>> 0,
    );
  }
  /**
   * Correlation coefficient (for correlation tests)
   * @returns {number | undefined}
   */
  get correlation() {
    const ret = wasm.__wbg_get_testresult_correlation(this.__wbg_ptr);
    return ret[0] === 0 ? undefined : ret[1];
  }
  /**
   * Correlation coefficient (for correlation tests)
   * @param {number | null} [arg0]
   */
  set correlation(arg0) {
    wasm.__wbg_set_testresult_correlation(
      this.__wbg_ptr,
      !isLikeNone(arg0),
      isLikeNone(arg0) ? 0 : arg0,
    );
  }
  /**
   * U statistic (for Mann-Whitney)
   * @returns {number | undefined}
   */
  get u_statistic() {
    const ret = wasm.__wbg_get_testresult_u_statistic(this.__wbg_ptr);
    return ret[0] === 0 ? undefined : ret[1];
  }
  /**
   * U statistic (for Mann-Whitney)
   * @param {number | null} [arg0]
   */
  set u_statistic(arg0) {
    wasm.__wbg_set_testresult_u_statistic(
      this.__wbg_ptr,
      !isLikeNone(arg0),
      isLikeNone(arg0) ? 0 : arg0,
    );
  }
  /**
   * W statistic (for Wilcoxon)
   * @returns {number | undefined}
   */
  get w_statistic() {
    const ret = wasm.__wbg_get_testresult_w_statistic(this.__wbg_ptr);
    return ret[0] === 0 ? undefined : ret[1];
  }
  /**
   * W statistic (for Wilcoxon)
   * @param {number | null} [arg0]
   */
  set w_statistic(arg0) {
    wasm.__wbg_set_testresult_w_statistic(
      this.__wbg_ptr,
      !isLikeNone(arg0),
      isLikeNone(arg0) ? 0 : arg0,
    );
  }
  /**
   * F statistic (for ANOVA)
   * @returns {number | undefined}
   */
  get f_statistic() {
    const ret = wasm.__wbg_get_testresult_f_statistic(this.__wbg_ptr);
    return ret[0] === 0 ? undefined : ret[1];
  }
  /**
   * F statistic (for ANOVA)
   * @param {number | null} [arg0]
   */
  set f_statistic(arg0) {
    wasm.__wbg_set_testresult_f_statistic(
      this.__wbg_ptr,
      !isLikeNone(arg0),
      isLikeNone(arg0) ? 0 : arg0,
    );
  }
  /**
   * Mean difference between groups
   * @returns {number | undefined}
   */
  get mean_difference() {
    const ret = wasm.__wbg_get_testresult_mean_difference(this.__wbg_ptr);
    return ret[0] === 0 ? undefined : ret[1];
  }
  /**
   * Mean difference between groups
   * @param {number | null} [arg0]
   */
  set mean_difference(arg0) {
    wasm.__wbg_set_testresult_mean_difference(
      this.__wbg_ptr,
      !isLikeNone(arg0),
      isLikeNone(arg0) ? 0 : arg0,
    );
  }
  /**
   * Standard error
   * @returns {number | undefined}
   */
  get standard_error() {
    const ret = wasm.__wbg_get_testresult_standard_error(this.__wbg_ptr);
    return ret[0] === 0 ? undefined : ret[1];
  }
  /**
   * Standard error
   * @param {number | null} [arg0]
   */
  set standard_error(arg0) {
    wasm.__wbg_set_testresult_standard_error(
      this.__wbg_ptr,
      !isLikeNone(arg0),
      isLikeNone(arg0) ? 0 : arg0,
    );
  }
  /**
   * Margin of error
   * @returns {number | undefined}
   */
  get margin_of_error() {
    const ret = wasm.__wbg_get_testresult_margin_of_error(this.__wbg_ptr);
    return ret[0] === 0 ? undefined : ret[1];
  }
  /**
   * Margin of error
   * @param {number | null} [arg0]
   */
  set margin_of_error(arg0) {
    wasm.__wbg_set_testresult_margin_of_error(
      this.__wbg_ptr,
      !isLikeNone(arg0),
      isLikeNone(arg0) ? 0 : arg0,
    );
  }
  /**
   * Sample means for each group
   * @returns {Float64Array | undefined}
   */
  get sample_means() {
    const ret = wasm.__wbg_get_testresult_sample_means(this.__wbg_ptr);
    let v1;
    if (ret[0] !== 0) {
      v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
      wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    }
    return v1;
  }
  /**
   * Sample means for each group
   * @param {Float64Array | null} [arg0]
   */
  set sample_means(arg0) {
    var ptr0 = isLikeNone(arg0)
      ? 0
      : passArrayF64ToWasm0(arg0, wasm.__wbindgen_malloc);
    var len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_testresult_sample_means(this.__wbg_ptr, ptr0, len0);
  }
  /**
   * Sample standard deviations for each group
   * @returns {Float64Array | undefined}
   */
  get sample_std_devs() {
    const ret = wasm.__wbg_get_testresult_sample_std_devs(this.__wbg_ptr);
    let v1;
    if (ret[0] !== 0) {
      v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
      wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    }
    return v1;
  }
  /**
   * Sample standard deviations for each group
   * @param {Float64Array | null} [arg0]
   */
  set sample_std_devs(arg0) {
    var ptr0 = isLikeNone(arg0)
      ? 0
      : passArrayF64ToWasm0(arg0, wasm.__wbindgen_malloc);
    var len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_testresult_sample_std_devs(this.__wbg_ptr, ptr0, len0);
  }
  /**
   * Expected frequencies (for chi-square)
   * @returns {Float64Array | undefined}
   */
  get chi_square_expected() {
    const ret = wasm.__wbg_get_testresult_chi_square_expected(this.__wbg_ptr);
    let v1;
    if (ret[0] !== 0) {
      v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
      wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    }
    return v1;
  }
  /**
   * Expected frequencies (for chi-square)
   * @param {Float64Array | null} [arg0]
   */
  set chi_square_expected(arg0) {
    var ptr0 = isLikeNone(arg0)
      ? 0
      : passArrayF64ToWasm0(arg0, wasm.__wbindgen_malloc);
    var len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_testresult_chi_square_expected(this.__wbg_ptr, ptr0, len0);
  }
  /**
   * Residuals (for chi-square)
   * @returns {Float64Array | undefined}
   */
  get residuals() {
    const ret = wasm.__wbg_get_testresult_residuals(this.__wbg_ptr);
    let v1;
    if (ret[0] !== 0) {
      v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
      wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    }
    return v1;
  }
  /**
   * Residuals (for chi-square)
   * @param {Float64Array | null} [arg0]
   */
  set residuals(arg0) {
    var ptr0 = isLikeNone(arg0)
      ? 0
      : passArrayF64ToWasm0(arg0, wasm.__wbindgen_malloc);
    var len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_testresult_residuals(this.__wbg_ptr, ptr0, len0);
  }
  /**
   * Ranks (for non-parametric tests)
   * @returns {Float64Array | undefined}
   */
  get ranks() {
    const ret = wasm.__wbg_get_testresult_ranks(this.__wbg_ptr);
    let v1;
    if (ret[0] !== 0) {
      v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
      wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    }
    return v1;
  }
  /**
   * Ranks (for non-parametric tests)
   * @param {Float64Array | null} [arg0]
   */
  set ranks(arg0) {
    var ptr0 = isLikeNone(arg0)
      ? 0
      : passArrayF64ToWasm0(arg0, wasm.__wbindgen_malloc);
    var len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_testresult_ranks(this.__wbg_ptr, ptr0, len0);
  }
  /**
   * Tie correction factor
   * @returns {number | undefined}
   */
  get tie_correction() {
    const ret = wasm.__wbg_get_testresult_tie_correction(this.__wbg_ptr);
    return ret[0] === 0 ? undefined : ret[1];
  }
  /**
   * Tie correction factor
   * @param {number | null} [arg0]
   */
  set tie_correction(arg0) {
    wasm.__wbg_set_testresult_tie_correction(
      this.__wbg_ptr,
      !isLikeNone(arg0),
      isLikeNone(arg0) ? 0 : arg0,
    );
  }
  /**
   * Exact p-value (when available)
   * @returns {number | undefined}
   */
  get exact_p_value() {
    const ret = wasm.__wbg_get_testresult_exact_p_value(this.__wbg_ptr);
    return ret[0] === 0 ? undefined : ret[1];
  }
  /**
   * Exact p-value (when available)
   * @param {number | null} [arg0]
   */
  set exact_p_value(arg0) {
    wasm.__wbg_set_testresult_exact_p_value(
      this.__wbg_ptr,
      !isLikeNone(arg0),
      isLikeNone(arg0) ? 0 : arg0,
    );
  }
  /**
   * Asymptotic p-value (for large samples)
   * @returns {number | undefined}
   */
  get asymptotic_p_value() {
    const ret = wasm.__wbg_get_testresult_asymptotic_p_value(this.__wbg_ptr);
    return ret[0] === 0 ? undefined : ret[1];
  }
  /**
   * Asymptotic p-value (for large samples)
   * @param {number | null} [arg0]
   */
  set asymptotic_p_value(arg0) {
    wasm.__wbg_set_testresult_asymptotic_p_value(
      this.__wbg_ptr,
      !isLikeNone(arg0),
      isLikeNone(arg0) ? 0 : arg0,
    );
  }
  /**
   * R-squared value
   * @returns {number | undefined}
   */
  get r_squared() {
    const ret = wasm.__wbg_get_testresult_r_squared(this.__wbg_ptr);
    return ret[0] === 0 ? undefined : ret[1];
  }
  /**
   * R-squared value
   * @param {number | null} [arg0]
   */
  set r_squared(arg0) {
    wasm.__wbg_set_testresult_r_squared(
      this.__wbg_ptr,
      !isLikeNone(arg0),
      isLikeNone(arg0) ? 0 : arg0,
    );
  }
  /**
   * Adjusted R-squared value
   * @returns {number | undefined}
   */
  get adjusted_r_squared() {
    const ret = wasm.__wbg_get_testresult_adjusted_r_squared(this.__wbg_ptr);
    return ret[0] === 0 ? undefined : ret[1];
  }
  /**
   * Adjusted R-squared value
   * @param {number | null} [arg0]
   */
  set adjusted_r_squared(arg0) {
    wasm.__wbg_set_testresult_adjusted_r_squared(
      this.__wbg_ptr,
      !isLikeNone(arg0),
      isLikeNone(arg0) ? 0 : arg0,
    );
  }
  /**
   * Akaike Information Criterion
   * @returns {number | undefined}
   */
  get aic() {
    const ret = wasm.__wbg_get_testresult_aic(this.__wbg_ptr);
    return ret[0] === 0 ? undefined : ret[1];
  }
  /**
   * Akaike Information Criterion
   * @param {number | null} [arg0]
   */
  set aic(arg0) {
    wasm.__wbg_set_testresult_aic(
      this.__wbg_ptr,
      !isLikeNone(arg0),
      isLikeNone(arg0) ? 0 : arg0,
    );
  }
  /**
   * Bayesian Information Criterion
   * @returns {number | undefined}
   */
  get bic() {
    const ret = wasm.__wbg_get_testresult_bic(this.__wbg_ptr);
    return ret[0] === 0 ? undefined : ret[1];
  }
  /**
   * Bayesian Information Criterion
   * @param {number | null} [arg0]
   */
  set bic(arg0) {
    wasm.__wbg_set_testresult_bic(
      this.__wbg_ptr,
      !isLikeNone(arg0),
      isLikeNone(arg0) ? 0 : arg0,
    );
  }
  /**
   * Sum of squares breakdown
   * @returns {Float64Array | undefined}
   */
  get sum_of_squares() {
    const ret = wasm.__wbg_get_testresult_sum_of_squares(this.__wbg_ptr);
    let v1;
    if (ret[0] !== 0) {
      v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
      wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    }
    return v1;
  }
  /**
   * Sum of squares breakdown
   * @param {Float64Array | null} [arg0]
   */
  set sum_of_squares(arg0) {
    var ptr0 = isLikeNone(arg0)
      ? 0
      : passArrayF64ToWasm0(arg0, wasm.__wbindgen_malloc);
    var len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_testresult_sum_of_squares(this.__wbg_ptr, ptr0, len0);
  }
  /**
   * Number of missing values
   * @returns {number | undefined}
   */
  get missing_values() {
    const ret = wasm.__wbg_get_testresult_missing_values(this.__wbg_ptr);
    return ret === 0x100000001 ? undefined : ret;
  }
  /**
   * Number of missing values
   * @param {number | null} [arg0]
   */
  set missing_values(arg0) {
    wasm.__wbg_set_testresult_missing_values(
      this.__wbg_ptr,
      isLikeNone(arg0) ? 0x100000001 : arg0 >>> 0,
    );
  }
  /**
   * Number of outliers detected
   * @returns {number | undefined}
   */
  get outliers_detected() {
    const ret = wasm.__wbg_get_testresult_outliers_detected(this.__wbg_ptr);
    return ret === 0x100000001 ? undefined : ret;
  }
  /**
   * Number of outliers detected
   * @param {number | null} [arg0]
   */
  set outliers_detected(arg0) {
    wasm.__wbg_set_testresult_outliers_detected(
      this.__wbg_ptr,
      isLikeNone(arg0) ? 0x100000001 : arg0 >>> 0,
    );
  }
  /**
   * List of violated assumptions
   * @returns {string[] | undefined}
   */
  get assumptions_violated() {
    const ret = wasm.__wbg_get_testresult_assumptions_violated(this.__wbg_ptr);
    let v1;
    if (ret[0] !== 0) {
      v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
      wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
    }
    return v1;
  }
  /**
   * List of violated assumptions
   * @param {string[] | null} [arg0]
   */
  set assumptions_violated(arg0) {
    var ptr0 = isLikeNone(arg0)
      ? 0
      : passArrayJsValueToWasm0(arg0, wasm.__wbindgen_malloc);
    var len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_testresult_assumptions_violated(this.__wbg_ptr, ptr0, len0);
  }
  /**
   * P-value from normality test
   * @returns {number | undefined}
   */
  get normality_test_p_value() {
    const ret = wasm.__wbg_get_testresult_normality_test_p_value(
      this.__wbg_ptr,
    );
    return ret[0] === 0 ? undefined : ret[1];
  }
  /**
   * P-value from normality test
   * @param {number | null} [arg0]
   */
  set normality_test_p_value(arg0) {
    wasm.__wbg_set_testresult_normality_test_p_value(
      this.__wbg_ptr,
      !isLikeNone(arg0),
      isLikeNone(arg0) ? 0 : arg0,
    );
  }
  /**
   * Error message if the test failed
   * @returns {string | undefined}
   */
  get error_message() {
    const ret = wasm.__wbg_get_testresult_error_message(this.__wbg_ptr);
    let v1;
    if (ret[0] !== 0) {
      v1 = getStringFromWasm0(ret[0], ret[1]).slice();
      wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    }
    return v1;
  }
  /**
   * Error message if the test failed
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
    wasm.__wbg_set_testresult_error_message(this.__wbg_ptr, ptr0, len0);
  }
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
