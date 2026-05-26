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
  wasm.__wbindgen_externrefs.set(idx, obj);
  return idx;
}

function debugString(val) {
  // primitive types
  const type = typeof val;
  if (type == "number" || type == "boolean" || val == null) {
    return `${val}`;
  }
  if (type == "string") {
    return `"${val}"`;
  }
  if (type == "symbol") {
    const description = val.description;
    if (description == null) {
      return "Symbol";
    } else {
      return `Symbol(${description})`;
    }
  }
  if (type == "function") {
    const name = val.name;
    if (typeof name == "string" && name.length > 0) {
      return `Function(${name})`;
    } else {
      return "Function";
    }
  }
  // objects
  if (Array.isArray(val)) {
    const length = val.length;
    let debug = "[";
    if (length > 0) {
      debug += debugString(val[0]);
    }
    for (let i = 1; i < length; i++) {
      debug += ", " + debugString(val[i]);
    }
    debug += "]";
    return debug;
  }
  // Test for built-in
  const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
  let className;
  if (builtInMatches && builtInMatches.length > 1) {
    className = builtInMatches[1];
  } else {
    // Failed to match the standard '[object ClassName]'
    return toString.call(val);
  }
  if (className == "Object") {
    // we're a user defined class or Object
    // JSON.stringify avoids problems with cycles, and is generally much
    // easier than looping through ownProperties of `val`.
    try {
      return "Object(" + JSON.stringify(val) + ")";
    } catch (_) {
      return "Object";
    }
  }
  // errors
  if (val instanceof Error) {
    return `${val.name}: ${val.message}\n${val.stack}`;
  }
  // TODO we could test for more things here, like `Set`s and `Map`s.
  return className;
}

function getArrayF64FromWasm0(ptr, len) {
  ptr = ptr >>> 0;
  return getFloat64ArrayMemory0().subarray(ptr / 8, ptr / 8 + len);
}

function getArrayI32FromWasm0(ptr, len) {
  ptr = ptr >>> 0;
  return getInt32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}

function getArrayJsValueFromWasm0(ptr, len) {
  ptr = ptr >>> 0;
  const mem = getDataViewMemory0();
  const result = [];
  for (let i = ptr; i < ptr + 4 * len; i += 4) {
    result.push(wasm.__wbindgen_externrefs.get(mem.getUint32(i, true)));
  }
  wasm.__externref_drop_slice(ptr, len);
  return result;
}

function getArrayU32FromWasm0(ptr, len) {
  ptr = ptr >>> 0;
  return getUint32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}

function getArrayU8FromWasm0(ptr, len) {
  ptr = ptr >>> 0;
  return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
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

let cachedInt32ArrayMemory0 = null;
function getInt32ArrayMemory0() {
  if (
    cachedInt32ArrayMemory0 === null || cachedInt32ArrayMemory0.byteLength === 0
  ) {
    cachedInt32ArrayMemory0 = new Int32Array(wasm.memory.buffer);
  }
  return cachedInt32ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
  ptr = ptr >>> 0;
  return decodeText(ptr, len);
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

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
  if (
    cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0
  ) {
    cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
  }
  return cachedUint8ArrayMemory0;
}

function handleError(f, args) {
  try {
    return f.apply(this, args);
  } catch (e) {
    const idx = addToExternrefTable0(e);
    wasm.__wbindgen_exn_store(idx);
  }
}

function isLikeNone(x) {
  return x === undefined || x === null;
}

function passArray32ToWasm0(arg, malloc) {
  const ptr = malloc(arg.length * 4, 4) >>> 0;
  getUint32ArrayMemory0().set(arg, ptr / 4);
  WASM_VECTOR_LEN = arg.length;
  return ptr;
}

function passArray8ToWasm0(arg, malloc) {
  const ptr = malloc(arg.length * 1, 1) >>> 0;
  getUint8ArrayMemory0().set(arg, ptr / 1);
  WASM_VECTOR_LEN = arg.length;
  return ptr;
}

function passArrayF64ToWasm0(arg, malloc) {
  const ptr = malloc(arg.length * 8, 8) >>> 0;
  getFloat64ArrayMemory0().set(arg, ptr / 8);
  WASM_VECTOR_LEN = arg.length;
  return ptr;
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
    const ret = cachedTextEncoder.encodeInto(arg, view);

    offset += ret.written;
    ptr = realloc(ptr, len, offset, 1) >>> 0;
  }

  WASM_VECTOR_LEN = offset;
  return ptr;
}

function takeFromExternrefTable0(idx) {
  const value = wasm.__wbindgen_externrefs.get(idx);
  wasm.__externref_table_dealloc(idx);
  return value;
}

let cachedTextDecoder = new TextDecoder("utf-8", {
  ignoreBOM: true,
  fatal: true,
});
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
  numBytesDecoded += len;
  if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
    cachedTextDecoder = new TextDecoder("utf-8", {
      ignoreBOM: true,
      fatal: true,
    });
    cachedTextDecoder.decode();
    numBytesDecoded = len;
  }
  return cachedTextDecoder.decode(
    getUint8ArrayMemory0().subarray(ptr, ptr + len),
  );
}

const cachedTextEncoder = new TextEncoder();

if (!("encodeInto" in cachedTextEncoder)) {
  cachedTextEncoder.encodeInto = function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
      read: arg.length,
      written: buf.length,
    };
  };
}

let WASM_VECTOR_LEN = 0;

const GroupingFinalization = (typeof FinalizationRegistry === "undefined")
  ? { register: () => {}, unregister: () => {} }
  : new FinalizationRegistry((ptr) => wasm.__wbg_grouping_free(ptr >>> 0, 1));

const JoinIdxU32Finalization = (typeof FinalizationRegistry === "undefined")
  ? { register: () => {}, unregister: () => {} }
  : new FinalizationRegistry((ptr) => wasm.__wbg_joinidxu32_free(ptr >>> 0, 1));

const PivotDenseF64Finalization = (typeof FinalizationRegistry === "undefined")
  ? { register: () => {}, unregister: () => {} }
  : new FinalizationRegistry((ptr) =>
    wasm.__wbg_pivotdensef64_free(ptr >>> 0, 1)
  );

const PivotLongerResultFinalization =
  (typeof FinalizationRegistry === "undefined")
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry((ptr) =>
      wasm.__wbg_pivotlongerresult_free(ptr >>> 0, 1)
    );

const PivotLongerStringResultFinalization =
  (typeof FinalizationRegistry === "undefined")
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry((ptr) =>
      wasm.__wbg_pivotlongerstringresult_free(ptr >>> 0, 1)
    );

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
if (Symbol.dispose) {
  Grouping.prototype[Symbol.dispose] = Grouping.prototype.free;
}

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
   * Move out the right indices (no clone)
   * @returns {Uint32Array}
   */
  takeRight() {
    const ret = wasm.joinidxu32_takeRight(this.__wbg_ptr);
    var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
    return v1;
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
}
if (Symbol.dispose) {
  JoinIdxU32.prototype[Symbol.dispose] = JoinIdxU32.prototype.free;
}

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
}
if (Symbol.dispose) {
  PivotDenseF64.prototype[Symbol.dispose] = PivotDenseF64.prototype.free;
}

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
}
if (Symbol.dispose) {
  PivotLongerResult.prototype[Symbol.dispose] =
    PivotLongerResult.prototype.free;
}

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
if (Symbol.dispose) {
  PivotLongerStringResult.prototype[Symbol.dispose] =
    PivotLongerStringResult.prototype.free;
}

/**
 * WASM export for Anderson-Darling normality test
 * @param {Float64Array} x
 * @param {number} alpha
 * @returns {any}
 */
export function anderson_darling_test(x, alpha) {
  const ptr0 = passArrayF64ToWasm0(x, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ret = wasm.anderson_darling_test(ptr0, len0, alpha);
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
}

/**
 * WASM export for one-way ANOVA
 * @param {Float64Array} data
 * @param {Uint32Array} group_sizes
 * @param {number} alpha
 * @returns {any}
 */
export function anova_one_way(data, group_sizes, alpha) {
  const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passArray32ToWasm0(group_sizes, wasm.__wbindgen_malloc);
  const len1 = WASM_VECTOR_LEN;
  const ret = wasm.anova_one_way(ptr0, len0, ptr1, len1, alpha);
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
}

/**
 * WASM export for two-way ANOVA
 * Takes flattened data with group information to reconstruct 2D factorial design
 * @param {Float64Array} data
 * @param {number} a_levels
 * @param {number} b_levels
 * @param {Uint32Array} cell_sizes
 * @param {number} alpha
 * @returns {any}
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
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
}

/**
 * WASM export for two-way ANOVA factor A
 * @param {Float64Array} data
 * @param {number} a_levels
 * @param {number} b_levels
 * @param {Uint32Array} cell_sizes
 * @param {number} alpha
 * @returns {any}
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
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
}

/**
 * WASM export for two-way ANOVA factor B
 * @param {Float64Array} data
 * @param {number} a_levels
 * @param {number} b_levels
 * @param {Uint32Array} cell_sizes
 * @param {number} alpha
 * @returns {any}
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
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
}

/**
 * WASM export for two-way ANOVA interaction
 * @param {Float64Array} data
 * @param {number} a_levels
 * @param {number} b_levels
 * @param {Uint32Array} cell_sizes
 * @param {number} alpha
 * @returns {any}
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
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
}

/**
 * WASM export: fill `indices` with sorted order (u32).
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
 * WASM export for batch stats
 * @param {Float64Array} values
 * @param {string} ops
 * @returns {Float64Array}
 */
export function batch_stats_wasm(values, ops) {
  const ptr0 = passArrayF64ToWasm0(values, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passStringToWasm0(
    ops,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len1 = WASM_VECTOR_LEN;
  const ret = wasm.batch_stats_wasm(ptr0, len0, ptr1, len1);
  var v3 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
  wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
  return v3;
}

/**
 * WASM export for chi-square goodness of fit test
 * @param {Float64Array} observed
 * @param {Float64Array} expected
 * @param {number} alpha
 * @returns {any}
 */
export function chi_square_goodness_of_fit(observed, expected, alpha) {
  const ptr0 = passArrayF64ToWasm0(observed, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passArrayF64ToWasm0(expected, wasm.__wbindgen_malloc);
  const len1 = WASM_VECTOR_LEN;
  const ret = wasm.chi_square_goodness_of_fit(ptr0, len0, ptr1, len1, alpha);
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
}

/**
 * WASM export for chi-square test of independence
 * @param {Float64Array} observed
 * @param {number} rows
 * @param {number} cols
 * @param {number} alpha
 * @returns {any}
 */
export function chi_square_independence(observed, rows, cols, alpha) {
  const ptr0 = passArrayF64ToWasm0(observed, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ret = wasm.chi_square_independence(ptr0, len0, rows, cols, alpha);
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
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
 * WASM export for chi-square test for variance
 * @param {Float64Array} data
 * @param {number} pop_variance
 * @param {string} tail
 * @param {number} alpha
 * @returns {any}
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
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
}

/**
 * Compute concordance statistic.
 * @param {string} time_json
 * @param {string} status_json
 * @param {string} x_json
 * @param {string | null} [options_json]
 * @returns {any}
 */
export function concordance_wasm(time_json, status_json, x_json, options_json) {
  const ptr0 = passStringToWasm0(
    time_json,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passStringToWasm0(
    status_json,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len1 = WASM_VECTOR_LEN;
  const ptr2 = passStringToWasm0(
    x_json,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len2 = WASM_VECTOR_LEN;
  var ptr3 = isLikeNone(options_json)
    ? 0
    : passStringToWasm0(
      options_json,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
  var len3 = WASM_VECTOR_LEN;
  const ret = wasm.concordance_wasm(
    ptr0,
    len0,
    ptr1,
    len1,
    ptr2,
    len2,
    ptr3,
    len3,
  );
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
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
 * Compute residuals for a counting process (start-stop) Cox model.
 *
 * # Arguments
 * * `input_json` - JSON object with:
 *   - start, stop, status, coef, covariates, type, method, weights, strata
 * @param {string} input_json
 * @returns {any}
 */
export function cox_residuals_counting_wasm(input_json) {
  const ptr0 = passStringToWasm0(
    input_json,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len0 = WASM_VECTOR_LEN;
  const ret = wasm.cox_residuals_counting_wasm(ptr0, len0);
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
}

/**
 * Compute Cox model residuals.
 *
 * # Arguments
 * * `time_json` - JSON array of event/censoring times
 * * `status_json` - JSON array of event indicators
 * * `coef_json` - JSON array of fitted coefficients
 * * `covariates_json` - JSON object mapping covariate names to arrays
 * * `options_json` - optional: method, type (mart/score/scho/deviance/dfbeta/dfbetas),
 *                    weights, offset, var (variance matrix for dfbeta/dfbetas)
 * @param {string} time_json
 * @param {string} status_json
 * @param {string} coef_json
 * @param {string} covariates_json
 * @param {string | null} [options_json]
 * @returns {any}
 */
export function cox_residuals_wasm(
  time_json,
  status_json,
  coef_json,
  covariates_json,
  options_json,
) {
  const ptr0 = passStringToWasm0(
    time_json,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passStringToWasm0(
    status_json,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len1 = WASM_VECTOR_LEN;
  const ptr2 = passStringToWasm0(
    coef_json,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len2 = WASM_VECTOR_LEN;
  const ptr3 = passStringToWasm0(
    covariates_json,
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
  const ret = wasm.cox_residuals_wasm(
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
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
}

/**
 * Proportional hazards test (cox.zph).
 * @param {string} time_json
 * @param {string} status_json
 * @param {string} coef_json
 * @param {string} covariates_json
 * @param {string | null} [options_json]
 * @returns {any}
 */
export function cox_zph_wasm(
  time_json,
  status_json,
  coef_json,
  covariates_json,
  options_json,
) {
  const ptr0 = passStringToWasm0(
    time_json,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passStringToWasm0(
    status_json,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len1 = WASM_VECTOR_LEN;
  const ptr2 = passStringToWasm0(
    coef_json,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len2 = WASM_VECTOR_LEN;
  const ptr3 = passStringToWasm0(
    covariates_json,
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
  const ret = wasm.cox_zph_wasm(
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
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
}

/**
 * Fit a Cox proportional hazards model to counting process (start-stop) data.
 *
 * # Arguments
 * * `input_json` - JSON object with:
 *   - start: entry times
 *   - stop: exit times
 *   - status: event indicators (0/1)
 *   - covariates: covariate name→values map
 *   - method: "breslow" or "efron" (default "efron")
 *   - maxiter: max iterations (default 25)
 *   - eps: convergence tolerance (default 1e-9)
 * @param {string} input_json
 * @returns {any}
 */
export function coxph_counting_wasm(input_json) {
  const ptr0 = passStringToWasm0(
    input_json,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len0 = WASM_VECTOR_LEN;
  const ret = wasm.coxph_counting_wasm(ptr0, len0);
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
}

/**
 * Fit a Cox proportional hazards model.
 *
 * # Arguments
 * * `time_json` - JSON array of event/censoring times
 * * `status_json` - JSON array of event indicators (1=event, 0=censored)
 * * `covariates_json` - JSON object mapping covariate names to arrays
 * * `options_json` - JSON object with optional params: method, maxiter, eps, weights, offset
 * @param {string} time_json
 * @param {string} status_json
 * @param {string} covariates_json
 * @param {string | null} [options_json]
 * @returns {any}
 */
export function coxph_wasm(
  time_json,
  status_json,
  covariates_json,
  options_json,
) {
  const ptr0 = passStringToWasm0(
    time_json,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passStringToWasm0(
    status_json,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len1 = WASM_VECTOR_LEN;
  const ptr2 = passStringToWasm0(
    covariates_json,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len2 = WASM_VECTOR_LEN;
  var ptr3 = isLikeNone(options_json)
    ? 0
    : passStringToWasm0(
      options_json,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
  var len3 = WASM_VECTOR_LEN;
  const ret = wasm.coxph_wasm(ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3);
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
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
 * WASM export for D'Agostino-Pearson K² normality test
 * @param {Float64Array} x
 * @param {number} alpha
 * @returns {any}
 */
export function dagostino_pearson_test(x, alpha) {
  const ptr0 = passArrayF64ToWasm0(x, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ret = wasm.dagostino_pearson_test(ptr0, len0, alpha);
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
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
 * WASM export for Dunn's test
 * @param {Float64Array} data
 * @param {Uint32Array} group_sizes
 * @param {number} alpha
 * @returns {any}
 */
export function dunn_test_wasm(data, group_sizes, alpha) {
  const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passArray32ToWasm0(group_sizes, wasm.__wbindgen_malloc);
  const len1 = WASM_VECTOR_LEN;
  const ret = wasm.dunn_test_wasm(ptr0, len0, ptr1, len1, alpha);
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
}

/**
 * Fine-Gray competing risks data transformation.
 *
 * Ports the full R `finegray()` function including:
 * - Censoring distribution G(t) via Kaplan-Meier
 * - Truncation distribution H(t) for delayed entry (Geskus 2011)
 * - Per-stratum processing
 * - Interval expansion via the core C algorithm
 *
 * # Input JSON format
 *
 * ```json
 * {
 *   "tstart": [0, 0, ...],       // entry times (all 0 for right-censored)
 *   "tstop": [1, 2, 3, ...],     // exit times
 *   "status": [1, 2, 0, ...],    // 0=censor, 1..k=event types
 *   "etype": 1,                   // event type of interest (1-based, default 1)
 *   "strata": [0, 0, 1, ...],    // optional stratum indicators
 *   "id": [1, 1, 2, 2, ...],     // optional subject IDs (required for counting process)
 *   "weights": [1, 1, ...],      // optional case weights
 *   "counting": false             // true if (start, stop] data
 * }
 * ```
 * @param {string} input_json
 * @returns {any}
 */
export function finegray_wasm(input_json) {
  const ptr0 = passStringToWasm0(
    input_json,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len0 = WASM_VECTOR_LEN;
  const ret = wasm.finegray_wasm(ptr0, len0);
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
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
 * @returns {any}
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
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
}

/**
 * WASM export for Games-Howell test
 * @param {Float64Array} data
 * @param {Uint32Array} group_sizes
 * @param {number} alpha
 * @returns {any}
 */
export function games_howell_wasm(data, group_sizes, alpha) {
  const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passArray32ToWasm0(group_sizes, wasm.__wbindgen_malloc);
  const len1 = WASM_VECTOR_LEN;
  const ret = wasm.games_howell_wasm(ptr0, len0, ptr1, len1, alpha);
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
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
 * @returns {any}
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
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
}

/**
 * GLM confint() - Compute confidence intervals for coefficients
 * @param {string} result
 * @param {number} level
 * @returns {any}
 */
export function glm_confint_wasm(result, level) {
  const ptr0 = passStringToWasm0(
    result,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len0 = WASM_VECTOR_LEN;
  const ret = wasm.glm_confint_wasm(ptr0, len0, level);
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
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
 * JsValue containing the fitted GLM result
 * @param {string} formula
 * @param {string} family_name
 * @param {string} link_name
 * @param {string} data_json
 * @param {string | null} [options_json]
 * @returns {any}
 */
export function glm_fit_wasm(
  formula,
  family_name,
  link_name,
  data_json,
  options_json,
) {
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
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
}

/**
 * WASM export for influence measures
 *
 * Returns influence() measures (dfbeta, dfbetas, dffits, covratio, cook's distance)
 * @param {string} result
 * @returns {any}
 */
export function glm_influence_wasm(result) {
  const ptr0 = passStringToWasm0(
    result,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len0 = WASM_VECTOR_LEN;
  const ret = wasm.glm_influence_wasm(ptr0, len0);
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
}

/**
 * GLM predict() - Make predictions on new data
 * @param {string} result
 * @param {any} newdata
 * @param {string} pred_type
 * @returns {any}
 */
export function glm_predict_wasm(result, newdata, pred_type) {
  const ptr0 = passStringToWasm0(
    result,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passStringToWasm0(
    pred_type,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len1 = WASM_VECTOR_LEN;
  const ret = wasm.glm_predict_wasm(ptr0, len0, newdata, ptr1, len1);
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
}

/**
 * WASM export for standardized residuals
 *
 * Returns rstandard() values
 * @param {string} result
 * @param {string} residual_type
 * @returns {any}
 */
export function glm_rstandard_wasm(result, residual_type) {
  const ptr0 = passStringToWasm0(
    result,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passStringToWasm0(
    residual_type,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len1 = WASM_VECTOR_LEN;
  const ret = wasm.glm_rstandard_wasm(ptr0, len0, ptr1, len1);
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
}

/**
 * WASM export for studentized residuals
 *
 * Returns rstudent() values
 * @param {string} result
 * @returns {any}
 */
export function glm_rstudent_wasm(result) {
  const ptr0 = passStringToWasm0(
    result,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len0 = WASM_VECTOR_LEN;
  const ret = wasm.glm_rstudent_wasm(ptr0, len0);
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
}

/**
 * WASM export for GLM summary
 *
 * Returns coefficient table with test statistics and p-values
 * @param {string} result
 * @returns {any}
 */
export function glm_summary_wasm(result) {
  const ptr0 = passStringToWasm0(
    result,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len0 = WASM_VECTOR_LEN;
  const ret = wasm.glm_summary_wasm(ptr0, len0);
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
}

/**
 * WASM export for clustered robust covariance matrix (sandwich::vcovCL)
 *
 * Accepts a JSON string with the specific fields needed by the sandwich
 * estimator, avoiding circular reference issues in the full GlmResult.
 * @param {string} sandwich_input_json
 * @param {any} cluster
 * @param {string} hc_type
 * @param {boolean} cadjust
 * @param {boolean} fix
 * @returns {any}
 */
export function glm_vcov_cl_wasm(
  sandwich_input_json,
  cluster,
  hc_type,
  cadjust,
  fix,
) {
  const ptr0 = passStringToWasm0(
    sandwich_input_json,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passStringToWasm0(
    hc_type,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len1 = WASM_VECTOR_LEN;
  const ret = wasm.glm_vcov_cl_wasm(
    ptr0,
    len0,
    cluster,
    ptr1,
    len1,
    cadjust,
    fix,
  );
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
}

/**
 * WASM export for GLMM fitting
 *
 * Fits a generalized linear mixed model using the provided formula and data.
 *
 * # Arguments
 * * `formula` - Fixed effects formula as string (e.g., "y ~ x1 + x2")
 * * `random_effects_json` - JSON array of random effect specifications
 * * `family_name` - Name of the family ("gaussian", "binomial", "poisson", etc.)
 * * `link_name` - Name of the link function ("identity", "logit", "log", etc.)
 * * `data_json` - JSON string containing the data as an object with column names as keys
 * * `options_json` - JSON string containing optional parameters
 *
 * # Returns
 * JsValue containing the fitted GLMM result
 * @param {string} formula
 * @param {string} random_effects_json
 * @param {string} family_name
 * @param {string} link_name
 * @param {string} data_json
 * @param {string | null} [options_json]
 * @returns {any}
 */
export function glmm_fit_wasm(
  formula,
  random_effects_json,
  family_name,
  link_name,
  data_json,
  options_json,
) {
  const ptr0 = passStringToWasm0(
    formula,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passStringToWasm0(
    random_effects_json,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len1 = WASM_VECTOR_LEN;
  const ptr2 = passStringToWasm0(
    family_name,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len2 = WASM_VECTOR_LEN;
  const ptr3 = passStringToWasm0(
    link_name,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len3 = WASM_VECTOR_LEN;
  const ptr4 = passStringToWasm0(
    data_json,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len4 = WASM_VECTOR_LEN;
  var ptr5 = isLikeNone(options_json)
    ? 0
    : passStringToWasm0(
      options_json,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
  var len5 = WASM_VECTOR_LEN;
  const ret = wasm.glmm_fit_wasm(
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
  );
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
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
 * WASM export for IQR calculation
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
 * @param {Float64Array} x
 * @param {Float64Array} y
 * @param {string} alternative
 * @param {number} alpha
 * @param {boolean | null} [exact]
 * @returns {any}
 */
export function kendall_correlation_test(x, y, alternative, alpha, exact) {
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
    isLikeNone(exact) ? 0xFFFFFF : exact ? 1 : 0,
  );
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
}

/**
 * WASM export for two-sample Kolmogorov-Smirnov test
 * @param {Float64Array} x
 * @param {Float64Array} y
 * @param {string} alternative
 * @param {number} alpha
 * @returns {any}
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
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
}

/**
 * WASM export for one-sample Kolmogorov-Smirnov test against uniform distribution
 * @param {Float64Array} x
 * @param {number} min
 * @param {number} max
 * @param {string} alternative
 * @param {number} alpha
 * @returns {any}
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
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
}

/**
 * WASM export for Kruskal-Wallis test
 * @param {Float64Array} data
 * @param {Uint32Array} group_sizes
 * @param {number} alpha
 * @returns {any}
 */
export function kruskal_wallis_test_wasm(data, group_sizes, alpha) {
  const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passArray32ToWasm0(group_sizes, wasm.__wbindgen_malloc);
  const len1 = WASM_VECTOR_LEN;
  const ret = wasm.kruskal_wallis_test_wasm(ptr0, len0, ptr1, len1, alpha);
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
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
 * * `Result<JsValue, JsValue>` - Serialized result or error
 * @param {Float64Array} data
 * @param {Uint32Array} group_sizes
 * @param {number} alpha
 * @returns {any}
 */
export function levene_test_wasm(data, group_sizes, alpha) {
  const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passArray32ToWasm0(group_sizes, wasm.__wbindgen_malloc);
  const len1 = WASM_VECTOR_LEN;
  const ret = wasm.levene_test_wasm(ptr0, len0, ptr1, len1, alpha);
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
}

/**
 * WASM export for Mann-Whitney U test (automatically chooses exact vs asymptotic)
 * @param {Float64Array} x
 * @param {Float64Array} y
 * @param {number} alpha
 * @param {string} alternative
 * @returns {any}
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
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
}

/**
 * WASM export for Mann-Whitney U test with configuration
 * @param {Float64Array} x
 * @param {Float64Array} y
 * @param {boolean} exact
 * @param {boolean} continuity_correction
 * @param {number} alpha
 * @param {string} alternative
 * @returns {any}
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
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
}

/**
 * WASM export for mean calculation
 * @param {Float64Array} values
 * @returns {number}
 */
export function mean_wasm(values) {
  const ptr0 = passArrayF64ToWasm0(values, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ret = wasm.mean_wasm(ptr0, len0);
  return ret;
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
 * WASM export for n_unique f64
 * @param {Float64Array} values
 * @returns {number}
 */
export function n_unique_f64(values) {
  const ptr0 = passArrayF64ToWasm0(values, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ret = wasm.n_unique_f64(ptr0, len0);
  return ret >>> 0;
}

/**
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
 * @param {Float64Array} x
 * @param {Float64Array} y
 * @param {string} alternative
 * @param {number} alpha
 * @returns {any}
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
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
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
 * WASM export for one-sample proportion test (chi-square approach, matches R)
 * @param {number} x
 * @param {number} n
 * @param {number} p0
 * @param {number} alpha
 * @param {string} alternative
 * @returns {any}
 */
export function proportion_test_one_sample(x, n, p0, alpha, alternative) {
  const ptr0 = passStringToWasm0(
    alternative,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len0 = WASM_VECTOR_LEN;
  const ret = wasm.proportion_test_one_sample(x, n, p0, alpha, ptr0, len0);
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
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
 * @returns {any}
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
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
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

/**
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
 * WASM export for Shapiro-Wilk normality test
 * @param {Float64Array} x
 * @param {number} alpha
 * @returns {any}
 */
export function shapiro_wilk_test(x, alpha) {
  const ptr0 = passArrayF64ToWasm0(x, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ret = wasm.shapiro_wilk_test(ptr0, len0, alpha);
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
}

/**
 * @param {Float64Array} x
 * @param {Float64Array} y
 * @param {string} alternative
 * @param {number} alpha
 * @returns {any}
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
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
}

/**
 * Stable sort `indices` by one f64 key vector (NaN last), asc/desc.
 * Uses tuple sort with NaN pre-partition.
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
 * Uses tuple sort with NA pre-partition.
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
 * WASM export for stdev calculation
 * @param {Float64Array} values
 * @returns {number}
 */
export function stdev_wasm(values) {
  const ptr0 = passArrayF64ToWasm0(values, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ret = wasm.stdev_wasm(ptr0, len0);
  return ret;
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
 * Compute log-rank test (survdiff).
 *
 * # Arguments
 * * `time_json` - JSON array of event/censoring times
 * * `status_json` - JSON array of event indicators
 * * `group_json` - JSON array of group assignments (0-based integers)
 * * `options_json` - optional: rho, strata
 * @param {string} time_json
 * @param {string} status_json
 * @param {string} group_json
 * @param {string | null} [options_json]
 * @returns {any}
 */
export function survdiff_wasm(
  time_json,
  status_json,
  group_json,
  options_json,
) {
  const ptr0 = passStringToWasm0(
    time_json,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passStringToWasm0(
    status_json,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len1 = WASM_VECTOR_LEN;
  const ptr2 = passStringToWasm0(
    group_json,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len2 = WASM_VECTOR_LEN;
  var ptr3 = isLikeNone(options_json)
    ? 0
    : passStringToWasm0(
      options_json,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
  var len3 = WASM_VECTOR_LEN;
  const ret = wasm.survdiff_wasm(
    ptr0,
    len0,
    ptr1,
    len1,
    ptr2,
    len2,
    ptr3,
    len3,
  );
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
}

/**
 * Compute survival curves from a fitted Cox model.
 *
 * Implements the R logic from `agsurv.R` + `coxsurv.fit` `expand()`:
 * - ctype=1 (Nelson-Aalen/Breslow): haz = nevent/nrisk_weighted
 * - ctype=2 (Efron): uses agsurv5 for tied deaths
 * - stype=1 (KP): product-limit via agsurv4
 * - stype=2 (exp): surv = exp(-cumhaz)
 *
 * # Arguments
 * * `input_json` - JSON object with:
 *   - time: event/censoring times
 *   - status: event indicators (0/1)
 *   - coef: fitted coefficients (empty array for null model)
 *   - covariates: covariate name→values map (empty for null model)
 *   - offset: offset terms (optional)
 *   - stype: 1=KP, 2=exp(-cumhaz) (default 2)
 *   - ctype: 1=Nelson-Aalen, 2=Efron (default 1)
 *   - censor: whether to include censoring times in output (default true)
 *   - newx: covariate values at which to predict (optional, for S(t|newx))
 *   - means: covariate means from fitted model (optional, for centering)
 *   - var: variance-covariance matrix from fitted model (fit$var, optional, for variance)
 * @param {string} input_json
 * @returns {any}
 */
export function survfit_cox_wasm(input_json) {
  const ptr0 = passStringToWasm0(
    input_json,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len0 = WASM_VECTOR_LEN;
  const ret = wasm.survfit_cox_wasm(ptr0, len0);
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
}

/**
 * Compute Kaplan-Meier survival curves.
 *
 * # Arguments
 * * `time_json` - JSON array of event/censoring times
 * * `status_json` - JSON array of event indicators (1=event, 0=censored)
 * * `options_json` - JSON with optional: groups (int[]), weights, stype, ctype
 * @param {string} time_json
 * @param {string} status_json
 * @param {string | null} [options_json]
 * @returns {any}
 */
export function survfit_km_wasm(time_json, status_json, options_json) {
  const ptr0 = passStringToWasm0(
    time_json,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passStringToWasm0(
    status_json,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len1 = WASM_VECTOR_LEN;
  var ptr2 = isLikeNone(options_json)
    ? 0
    : passStringToWasm0(
      options_json,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
  var len2 = WASM_VECTOR_LEN;
  const ret = wasm.survfit_km_wasm(ptr0, len0, ptr1, len1, ptr2, len2);
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
}

/**
 * Split survival data at specified cut points.
 * @param {string} tstart_json
 * @param {string} tstop_json
 * @param {string} cut_json
 * @returns {any}
 */
export function survsplit_wasm(tstart_json, tstop_json, cut_json) {
  const ptr0 = passStringToWasm0(
    tstart_json,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passStringToWasm0(
    tstop_json,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len1 = WASM_VECTOR_LEN;
  const ptr2 = passStringToWasm0(
    cut_json,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len2 = WASM_VECTOR_LEN;
  const ret = wasm.survsplit_wasm(ptr0, len0, ptr1, len1, ptr2, len2);
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
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
 * WASM export for one-sample t-test
 * @param {Float64Array} x
 * @param {number} mu
 * @param {number} alpha
 * @param {string} alternative
 * @returns {any}
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
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
}

/**
 * WASM export for paired t-test
 * @param {Float64Array} x
 * @param {Float64Array} y
 * @param {number} alpha
 * @param {string} alternative
 * @returns {any}
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
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
}

/**
 * WASM export for independent two-sample t-test
 * @param {Float64Array} x
 * @param {Float64Array} y
 * @param {number} alpha
 * @param {string} alternative
 * @param {boolean} pooled
 * @returns {any}
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
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
}

/**
 * WASM export for target trial emulation.
 *
 * Runs the full pipeline in Rust: expand → weights → model → survival → hazard → bootstrap.
 *
 * # Arguments
 * * `config_json` - JSON string containing `TargetTrialConfig`
 * * `data_json` - JSON string containing `ColumnarData` (numeric + categorical columns)
 *
 * # Returns
 * JsValue containing the `TargetTrialResult`
 * @param {string} config_json
 * @param {string} data_json
 * @returns {any}
 */
export function target_trial_wasm(config_json, data_json) {
  const ptr0 = passStringToWasm0(
    config_json,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passStringToWasm0(
    data_json,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len1 = WASM_VECTOR_LEN;
  const ret = wasm.target_trial_wasm(ptr0, len0, ptr1, len1);
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
}

/**
 * WASM export for Tukey HSD test
 * @param {Float64Array} data
 * @param {Uint32Array} group_sizes
 * @param {number} alpha
 * @returns {any}
 */
export function tukey_hsd_wasm(data, group_sizes, alpha) {
  const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passArray32ToWasm0(group_sizes, wasm.__wbindgen_malloc);
  const len1 = WASM_VECTOR_LEN;
  const ret = wasm.tukey_hsd_wasm(ptr0, len0, ptr1, len1, alpha);
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
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
 * WASM export for variance calculation
 * @param {Float64Array} values
 * @returns {number}
 */
export function variance_wasm(values) {
  const ptr0 = passArrayF64ToWasm0(values, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ret = wasm.variance_wasm(ptr0, len0);
  return ret;
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
 * @param {number} x
 * @param {number} location
 * @param {boolean} give_log
 * @returns {number}
 */
export function wasm_ddirac(x, location, give_log) {
  const ret = wasm.wasm_ddirac(x, location, give_log);
  return ret;
}

/**
 * @param {number} x
 * @param {number} location
 * @param {number} scale
 * @param {boolean} give_log
 * @returns {number}
 */
export function wasm_dev1(x, location, scale, give_log) {
  const ret = wasm.wasm_dev1(x, location, scale, give_log);
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
 * @param {number} x
 * @param {number} scale
 * @param {number} shape
 * @param {boolean} give_log
 * @returns {number}
 */
export function wasm_dpareto(x, scale, shape, give_log) {
  const ret = wasm.wasm_dpareto(x, scale, shape, give_log);
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
 * @param {number} x
 * @param {number} n
 * @param {number} s
 * @param {boolean} give_log
 * @returns {number}
 */
export function wasm_dzipf(x, n, s, give_log) {
  const ret = wasm.wasm_dzipf(x, n, s, give_log);
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
 * @param {number} x
 * @param {number} location
 * @param {boolean} lower_tail
 * @param {boolean} log_p
 * @returns {number}
 */
export function wasm_pdirac(x, location, lower_tail, log_p) {
  const ret = wasm.wasm_pdirac(x, location, lower_tail, log_p);
  return ret;
}

/**
 * @param {number} x
 * @param {number} location
 * @param {number} scale
 * @param {boolean} lower_tail
 * @param {boolean} log_p
 * @returns {number}
 */
export function wasm_pev1(x, location, scale, lower_tail, log_p) {
  const ret = wasm.wasm_pev1(x, location, scale, lower_tail, log_p);
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
 * @param {number} x
 * @param {number} scale
 * @param {number} shape
 * @param {boolean} lower_tail
 * @param {boolean} log_p
 * @returns {number}
 */
export function wasm_ppareto(x, scale, shape, lower_tail, log_p) {
  const ret = wasm.wasm_ppareto(x, scale, shape, lower_tail, log_p);
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
 * @param {number} x
 * @param {number} n
 * @param {number} s
 * @param {boolean} lower_tail
 * @param {boolean} log_p
 * @returns {number}
 */
export function wasm_pzipf(x, n, s, lower_tail, log_p) {
  const ret = wasm.wasm_pzipf(x, n, s, lower_tail, log_p);
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
 * @param {number} p
 * @param {number} location
 * @param {boolean} lower_tail
 * @param {boolean} log_p
 * @returns {number}
 */
export function wasm_qdirac(p, location, lower_tail, log_p) {
  const ret = wasm.wasm_qdirac(p, location, lower_tail, log_p);
  return ret;
}

/**
 * @param {number} p
 * @param {number} location
 * @param {number} scale
 * @param {boolean} lower_tail
 * @param {boolean} log_p
 * @returns {number}
 */
export function wasm_qev1(p, location, scale, lower_tail, log_p) {
  const ret = wasm.wasm_qev1(p, location, scale, lower_tail, log_p);
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
 * @param {number} p
 * @param {number} scale
 * @param {number} shape
 * @param {boolean} lower_tail
 * @param {boolean} log_p
 * @returns {number}
 */
export function wasm_qpareto(p, scale, shape, lower_tail, log_p) {
  const ret = wasm.wasm_qpareto(p, scale, shape, lower_tail, log_p);
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
 * @param {number} p
 * @param {number} n
 * @param {number} s
 * @param {boolean} lower_tail
 * @param {boolean} log_p
 * @returns {number}
 */
export function wasm_qzipf(p, n, s, lower_tail, log_p) {
  const ret = wasm.wasm_qzipf(p, n, s, lower_tail, log_p);
  return ret;
}

/**
 * Draw `n` samples from `Beta(shape1, shape2)`. See `wasm_rnorm` doc comment
 * for seed semantics.
 * @param {number} shape1
 * @param {number} shape2
 * @param {number} n
 * @param {number | null} [seed]
 * @returns {Float64Array}
 */
export function wasm_rbeta(shape1, shape2, n, seed) {
  const ret = wasm.wasm_rbeta(
    shape1,
    shape2,
    n,
    isLikeNone(seed) ? 0x100000001 : seed >>> 0,
  );
  var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
  wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
  return v1;
}

/**
 * @param {number} size
 * @param {number} prob
 * @param {number} n
 * @param {number | null} [seed]
 * @returns {Float64Array}
 */
export function wasm_rbinom(size, prob, n, seed) {
  const ret = wasm.wasm_rbinom(
    size,
    prob,
    n,
    isLikeNone(seed) ? 0x100000001 : seed >>> 0,
  );
  var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
  wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
  return v1;
}

/**
 * @param {number} df
 * @param {number} n
 * @param {number | null} [seed]
 * @returns {Float64Array}
 */
export function wasm_rchisq(df, n, seed) {
  const ret = wasm.wasm_rchisq(
    df,
    n,
    isLikeNone(seed) ? 0x100000001 : seed >>> 0,
  );
  var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
  wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
  return v1;
}

/**
 * @param {number} location
 * @param {number} n
 * @param {number | null} [seed]
 * @returns {Float64Array}
 */
export function wasm_rdirac(location, n, seed) {
  const ret = wasm.wasm_rdirac(
    location,
    n,
    isLikeNone(seed) ? 0x100000001 : seed >>> 0,
  );
  var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
  wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
  return v1;
}

/**
 * @param {number} location
 * @param {number} scale
 * @param {number} n
 * @param {number | null} [seed]
 * @returns {Float64Array}
 */
export function wasm_rev1(location, scale, n, seed) {
  const ret = wasm.wasm_rev1(
    location,
    scale,
    n,
    isLikeNone(seed) ? 0x100000001 : seed >>> 0,
  );
  var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
  wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
  return v1;
}

/**
 * @param {number} rate
 * @param {number} n
 * @param {number | null} [seed]
 * @returns {Float64Array}
 */
export function wasm_rexp(rate, n, seed) {
  const ret = wasm.wasm_rexp(
    rate,
    n,
    isLikeNone(seed) ? 0x100000001 : seed >>> 0,
  );
  var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
  wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
  return v1;
}

/**
 * @param {number} df1
 * @param {number} df2
 * @param {number} n
 * @param {number | null} [seed]
 * @returns {Float64Array}
 */
export function wasm_rf(df1, df2, n, seed) {
  const ret = wasm.wasm_rf(
    df1,
    df2,
    n,
    isLikeNone(seed) ? 0x100000001 : seed >>> 0,
  );
  var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
  wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
  return v1;
}

/**
 * @param {number} shape
 * @param {number} rate
 * @param {number} n
 * @param {number | null} [seed]
 * @returns {Float64Array}
 */
export function wasm_rgamma(shape, rate, n, seed) {
  const ret = wasm.wasm_rgamma(
    shape,
    rate,
    n,
    isLikeNone(seed) ? 0x100000001 : seed >>> 0,
  );
  var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
  wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
  return v1;
}

/**
 * @param {number} prob
 * @param {number} n
 * @param {number | null} [seed]
 * @returns {Float64Array}
 */
export function wasm_rgeom(prob, n, seed) {
  const ret = wasm.wasm_rgeom(
    prob,
    n,
    isLikeNone(seed) ? 0x100000001 : seed >>> 0,
  );
  var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
  wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
  return v1;
}

/**
 * @param {number} m
 * @param {number} n
 * @param {number} k
 * @param {number} count
 * @param {number | null} [seed]
 * @returns {Float64Array}
 */
export function wasm_rhyper(m, n, k, count, seed) {
  const ret = wasm.wasm_rhyper(
    m,
    n,
    k,
    count,
    isLikeNone(seed) ? 0x100000001 : seed >>> 0,
  );
  var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
  wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
  return v1;
}

/**
 * @param {number} meanlog
 * @param {number} sdlog
 * @param {number} n
 * @param {number | null} [seed]
 * @returns {Float64Array}
 */
export function wasm_rlnorm(meanlog, sdlog, n, seed) {
  const ret = wasm.wasm_rlnorm(
    meanlog,
    sdlog,
    n,
    isLikeNone(seed) ? 0x100000001 : seed >>> 0,
  );
  var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
  wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
  return v1;
}

/**
 * @param {number} r
 * @param {number} prob
 * @param {number} n
 * @param {number | null} [seed]
 * @returns {Float64Array}
 */
export function wasm_rnbinom(r, prob, n, seed) {
  const ret = wasm.wasm_rnbinom(
    r,
    prob,
    n,
    isLikeNone(seed) ? 0x100000001 : seed >>> 0,
  );
  var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
  wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
  return v1;
}

/**
 * Draw `n` samples from `Normal(mean, sd)` in a single call.
 *
 * With `seed = Some(s)` the sequence is fully reproducible (one RNG state
 * advances across every draw — same contract as R's `set.seed(s); rnorm(n)`
 * and numpy's `default_rng(s).normal(size=n)`). With `seed = None` uses
 * `thread_rng()` for non-determinism. The caller passes `n = 1` for a
 * single draw.
 * @param {number} mean
 * @param {number} sd
 * @param {number} n
 * @param {number | null} [seed]
 * @returns {Float64Array}
 */
export function wasm_rnorm(mean, sd, n, seed) {
  const ret = wasm.wasm_rnorm(
    mean,
    sd,
    n,
    isLikeNone(seed) ? 0x100000001 : seed >>> 0,
  );
  var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
  wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
  return v1;
}

/**
 * @param {number} scale
 * @param {number} shape
 * @param {number} n
 * @param {number | null} [seed]
 * @returns {Float64Array}
 */
export function wasm_rpareto(scale, shape, n, seed) {
  const ret = wasm.wasm_rpareto(
    scale,
    shape,
    n,
    isLikeNone(seed) ? 0x100000001 : seed >>> 0,
  );
  var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
  wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
  return v1;
}

/**
 * @param {number} lambda
 * @param {number} n
 * @param {number | null} [seed]
 * @returns {Float64Array}
 */
export function wasm_rpois(lambda, n, seed) {
  const ret = wasm.wasm_rpois(
    lambda,
    n,
    isLikeNone(seed) ? 0x100000001 : seed >>> 0,
  );
  var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
  wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
  return v1;
}

/**
 * @param {number} df
 * @param {number} n
 * @param {number | null} [seed]
 * @returns {Float64Array}
 */
export function wasm_rt(df, n, seed) {
  const ret = wasm.wasm_rt(df, n, isLikeNone(seed) ? 0x100000001 : seed >>> 0);
  var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
  wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
  return v1;
}

/**
 * @param {number} min
 * @param {number} max
 * @param {number} n
 * @param {number | null} [seed]
 * @returns {Float64Array}
 */
export function wasm_runif(min, max, n, seed) {
  const ret = wasm.wasm_runif(
    min,
    max,
    n,
    isLikeNone(seed) ? 0x100000001 : seed >>> 0,
  );
  var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
  wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
  return v1;
}

/**
 * @param {number} shape
 * @param {number} scale
 * @param {number} n
 * @param {number | null} [seed]
 * @returns {Float64Array}
 */
export function wasm_rweibull(shape, scale, n, seed) {
  const ret = wasm.wasm_rweibull(
    shape,
    scale,
    n,
    isLikeNone(seed) ? 0x100000001 : seed >>> 0,
  );
  var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
  wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
  return v1;
}

/**
 * @param {number} m
 * @param {number} n
 * @param {number} count
 * @param {number | null} [seed]
 * @returns {Float64Array}
 */
export function wasm_rwilcox(m, n, count, seed) {
  const ret = wasm.wasm_rwilcox(
    m,
    n,
    count,
    isLikeNone(seed) ? 0x100000001 : seed >>> 0,
  );
  var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
  wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
  return v1;
}

/**
 * @param {number} n
 * @param {number} s
 * @param {number} count
 * @param {number | null} [seed]
 * @returns {Float64Array}
 */
export function wasm_rzipf(n, s, count, seed) {
  const ret = wasm.wasm_rzipf(
    n,
    s,
    count,
    isLikeNone(seed) ? 0x100000001 : seed >>> 0,
  );
  var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
  wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
  return v1;
}

/**
 * @returns {number}
 */
export function wasm_test() {
  const ret = wasm.wasm_test();
  return ret;
}

/**
 * WASM export for Welch's ANOVA (unequal variances)
 * @param {Float64Array} data
 * @param {Uint32Array} group_sizes
 * @param {number} alpha
 * @returns {any}
 */
export function welch_anova_wasm(data, group_sizes, alpha) {
  const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passArray32ToWasm0(group_sizes, wasm.__wbindgen_malloc);
  const len1 = WASM_VECTOR_LEN;
  const ret = wasm.welch_anova_wasm(ptr0, len0, ptr1, len1, alpha);
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
}

/**
 * WASM export for Wilcoxon W test (paired)
 * @param {Float64Array} x
 * @param {Float64Array} y
 * @param {number} alpha
 * @param {string} alternative
 * @returns {any}
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
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
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
 * WASM export for one-sample z-test
 * @param {Float64Array} x
 * @param {number} mu
 * @param {number} sigma
 * @param {number} alpha
 * @param {string} alternative
 * @returns {any}
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
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
}

/**
 * WASM export for two-sample z-test
 * @param {Float64Array} x
 * @param {Float64Array} y
 * @param {number} sigma_x
 * @param {number} sigma_y
 * @param {number} alpha
 * @param {string} alternative
 * @returns {any}
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
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
}

export function __wbg_Error_52673b7de5a0ca89(arg0, arg1) {
  const ret = Error(getStringFromWasm0(arg0, arg1));
  return ret;
}

export function __wbg_Number_2d1dcfcf4ec51736(arg0) {
  const ret = Number(arg0);
  return ret;
}

export function __wbg_String_8f0eb39a4a4c2f66(arg0, arg1) {
  const ret = String(arg1);
  const ptr1 = passStringToWasm0(
    ret,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len1 = WASM_VECTOR_LEN;
  getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
  getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
}

export function __wbg___wbindgen_boolean_get_dea25b33882b895b(arg0) {
  const v = arg0;
  const ret = typeof v === "boolean" ? v : undefined;
  return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
}

export function __wbg___wbindgen_copy_to_typed_array_db832bc4df7216c1(
  arg0,
  arg1,
  arg2,
) {
  new Uint8Array(arg2.buffer, arg2.byteOffset, arg2.byteLength).set(
    getArrayU8FromWasm0(arg0, arg1),
  );
}

export function __wbg___wbindgen_debug_string_adfb662ae34724b6(arg0, arg1) {
  const ret = debugString(arg1);
  const ptr1 = passStringToWasm0(
    ret,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len1 = WASM_VECTOR_LEN;
  getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
  getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
}

export function __wbg___wbindgen_is_function_8d400b8b1af978cd(arg0) {
  const ret = typeof arg0 === "function";
  return ret;
}

export function __wbg___wbindgen_is_object_ce774f3490692386(arg0) {
  const val = arg0;
  const ret = typeof val === "object" && val !== null;
  return ret;
}

export function __wbg___wbindgen_is_string_704ef9c8fc131030(arg0) {
  const ret = typeof arg0 === "string";
  return ret;
}

export function __wbg___wbindgen_is_undefined_f6b95eab589e0269(arg0) {
  const ret = arg0 === undefined;
  return ret;
}

export function __wbg___wbindgen_jsval_loose_eq_766057600fdd1b0d(arg0, arg1) {
  const ret = arg0 == arg1;
  return ret;
}

export function __wbg___wbindgen_number_get_9619185a74197f95(arg0, arg1) {
  const obj = arg1;
  const ret = typeof obj === "number" ? obj : undefined;
  getDataViewMemory0().setFloat64(
    arg0 + 8 * 1,
    isLikeNone(ret) ? 0 : ret,
    true,
  );
  getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
}

export function __wbg___wbindgen_string_get_a2a31e16edf96e42(arg0, arg1) {
  const obj = arg1;
  const ret = typeof obj === "string" ? obj : undefined;
  var ptr1 = isLikeNone(ret)
    ? 0
    : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
  var len1 = WASM_VECTOR_LEN;
  getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
  getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
}

export function __wbg___wbindgen_throw_dd24417ed36fc46e(arg0, arg1) {
  throw new Error(getStringFromWasm0(arg0, arg1));
}

export function __wbg_call_3020136f7a2d6e44() {
  return handleError(function (arg0, arg1, arg2) {
    const ret = arg0.call(arg1, arg2);
    return ret;
  }, arguments);
}

export function __wbg_call_abb4ff46ce38be40() {
  return handleError(function (arg0, arg1) {
    const ret = arg0.call(arg1);
    return ret;
  }, arguments);
}

export function __wbg_crypto_574e78ad8b13b65f(arg0) {
  const ret = arg0.crypto;
  return ret;
}

export function __wbg_done_62ea16af4ce34b24(arg0) {
  const ret = arg0.done;
  return ret;
}

export function __wbg_getRandomValues_b8f5dbd5f3995a9e() {
  return handleError(function (arg0, arg1) {
    arg0.getRandomValues(arg1);
  }, arguments);
}

export function __wbg_get_6b7bd52aca3f9671(arg0, arg1) {
  const ret = arg0[arg1 >>> 0];
  return ret;
}

export function __wbg_get_af9dab7e9603ea93() {
  return handleError(function (arg0, arg1) {
    const ret = Reflect.get(arg0, arg1);
    return ret;
  }, arguments);
}

export function __wbg_get_index_1226ed36df27e708(arg0, arg1) {
  const ret = arg0[arg1 >>> 0];
  return ret;
}

export function __wbg_instanceof_ArrayBuffer_f3320d2419cd0355(arg0) {
  let result;
  try {
    result = arg0 instanceof ArrayBuffer;
  } catch (_) {
    result = false;
  }
  const ret = result;
  return ret;
}

export function __wbg_instanceof_Uint8Array_da54ccc9d3e09434(arg0) {
  let result;
  try {
    result = arg0 instanceof Uint8Array;
  } catch (_) {
    result = false;
  }
  const ret = result;
  return ret;
}

export function __wbg_isArray_51fd9e6422c0a395(arg0) {
  const ret = Array.isArray(arg0);
  return ret;
}

export function __wbg_isSafeInteger_ae7d3f054d55fa16(arg0) {
  const ret = Number.isSafeInteger(arg0);
  return ret;
}

export function __wbg_iterator_27b7c8b35ab3e86b() {
  const ret = Symbol.iterator;
  return ret;
}

export function __wbg_length_22ac23eaec9d8053(arg0) {
  const ret = arg0.length;
  return ret;
}

export function __wbg_length_406f6daaaa453057(arg0) {
  const ret = arg0.length;
  return ret;
}

export function __wbg_length_89c3414ed7f0594d(arg0) {
  const ret = arg0.length;
  return ret;
}

export function __wbg_length_d45040a40c570362(arg0) {
  const ret = arg0.length;
  return ret;
}

export function __wbg_log_1d990106d99dacb7(arg0) {
  console.log(arg0);
}

export function __wbg_msCrypto_a61aeb35a24c1329(arg0) {
  const ret = arg0.msCrypto;
  return ret;
}

export function __wbg_new_1ba21ce319a06297() {
  const ret = new Object();
  return ret;
}

export function __wbg_new_25f239778d6112b9() {
  const ret = new Array();
  return ret;
}

export function __wbg_new_6421f6084cc5bc5a(arg0) {
  const ret = new Uint8Array(arg0);
  return ret;
}

export function __wbg_new_b546ae120718850e() {
  const ret = new Map();
  return ret;
}

export function __wbg_new_no_args_cb138f77cf6151ee(arg0, arg1) {
  const ret = new Function(getStringFromWasm0(arg0, arg1));
  return ret;
}

export function __wbg_new_with_length_aa5eaf41d35235e5(arg0) {
  const ret = new Uint8Array(arg0 >>> 0);
  return ret;
}

export function __wbg_next_138a17bbf04e926c(arg0) {
  const ret = arg0.next;
  return ret;
}

export function __wbg_next_3cfe5c0fe2a4cc53() {
  return handleError(function (arg0) {
    const ret = arg0.next();
    return ret;
  }, arguments);
}

export function __wbg_node_905d3e251edff8a2(arg0) {
  const ret = arg0.node;
  return ret;
}

export function __wbg_process_dc0fbacc7c1c06f7(arg0) {
  const ret = arg0.process;
  return ret;
}

export function __wbg_prototypesetcall_6a0ca140cebe5ef8(arg0, arg1, arg2) {
  Uint32Array.prototype.set.call(getArrayU32FromWasm0(arg0, arg1), arg2);
}

export function __wbg_prototypesetcall_d3c4edbb4ef96ca1(arg0, arg1, arg2) {
  Float64Array.prototype.set.call(getArrayF64FromWasm0(arg0, arg1), arg2);
}

export function __wbg_prototypesetcall_dfe9b766cdc1f1fd(arg0, arg1, arg2) {
  Uint8Array.prototype.set.call(getArrayU8FromWasm0(arg0, arg1), arg2);
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

export function __wbg_set_3f1d0b984ed272ed(arg0, arg1, arg2) {
  arg0[arg1] = arg2;
}

export function __wbg_set_7df433eea03a5c14(arg0, arg1, arg2) {
  arg0[arg1 >>> 0] = arg2;
}

export function __wbg_set_efaaf145b9377369(arg0, arg1, arg2) {
  const ret = arg0.set(arg1, arg2);
  return ret;
}

export function __wbg_static_accessor_GLOBAL_769e6b65d6557335() {
  const ret = typeof global === "undefined" ? null : global;
  return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
}

export function __wbg_static_accessor_GLOBAL_THIS_60cf02db4de8e1c1() {
  const ret = typeof globalThis === "undefined" ? null : globalThis;
  return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
}

export function __wbg_static_accessor_SELF_08f5a74c69739274() {
  const ret = typeof self === "undefined" ? null : self;
  return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
}

export function __wbg_static_accessor_WINDOW_a8924b26aa92d024() {
  const ret = typeof window === "undefined" ? null : window;
  return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
}

export function __wbg_subarray_845f2f5bce7d061a(arg0, arg1, arg2) {
  const ret = arg0.subarray(arg1 >>> 0, arg2 >>> 0);
  return ret;
}

export function __wbg_value_57b7b035e117f7ee(arg0) {
  const ret = arg0.value;
  return ret;
}

export function __wbg_versions_c01dfd4722a88165(arg0) {
  const ret = arg0.versions;
  return ret;
}

export function __wbindgen_cast_2241b6af4c4b2941(arg0, arg1) {
  // Cast intrinsic for `Ref(String) -> Externref`.
  const ret = getStringFromWasm0(arg0, arg1);
  return ret;
}

export function __wbindgen_cast_4625c577ab2ec9ee(arg0) {
  // Cast intrinsic for `U64 -> Externref`.
  const ret = BigInt.asUintN(64, arg0);
  return ret;
}

export function __wbindgen_cast_9ae0607507abb057(arg0) {
  // Cast intrinsic for `I64 -> Externref`.
  const ret = arg0;
  return ret;
}

export function __wbindgen_cast_cb9088102bce6b30(arg0, arg1) {
  // Cast intrinsic for `Ref(Slice(U8)) -> NamedExternref("Uint8Array")`.
  const ret = getArrayU8FromWasm0(arg0, arg1);
  return ret;
}

export function __wbindgen_cast_d6cd19b81560fd6e(arg0) {
  // Cast intrinsic for `F64 -> Externref`.
  const ret = arg0;
  return ret;
}

export function __wbindgen_init_externref_table() {
  const table = wasm.__wbindgen_externrefs;
  const offset = table.grow(4);
  table.set(0, undefined);
  table.set(offset + 0, undefined);
  table.set(offset + 1, null);
  table.set(offset + 2, true);
  table.set(offset + 3, false);
}
