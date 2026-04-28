// A light view: keeps a pointer to the column store + optional
// row index (ordering/subset), optional bitset mask, and cached derived index.

export type BitSet = {
  bits: Uint32Array;
  size: number; // number of rows in the *base* store
};

export type View = {
  index?: Uint32Array | null; // when set, defines row order/subset
  mask?: BitSet | null; // when set, defines keep/discard
  // Derived cache
  _materializedIndex?: Uint32Array | null;
  // Optional compiled comparator used by arrange()
  _order?: (ai: number, bi: number, cols: Record<string, unknown[]>) => number;
};

// ----------------------------------------------------------------------------
// Bit constants
// ----------------------------------------------------------------------------
const ONE = 0x80000000 >>> 0;
const ALL = 0xFFFFFFFF >>> 0;

// ----------------------------------------------------------------------------
/** Create an empty bitset for n rows. */
export function createBitSet(n: number): BitSet {
  return { bits: new Uint32Array((n + 31) >>> 5), size: n };
}

/** Set bit i. */
export function bitsetSet(bs: BitSet, i: number) {
  bs.bits[i >>> 5] |= ONE >>> (i & 31);
}

/** Test bit i (boolean). */
function bitsetTest(bs: BitSet, i: number) {
  return (bs.bits[i >>> 5] & (ONE >>> (i & 31))) !== 0;
}

/** Alias used by call sites: get bit i (boolean). */
export function bitsetGet(bs: BitSet, i: number) {
  return bitsetTest(bs, i);
}

/** Clear bit i. */
export function bitsetClear(bs: BitSet, i: number) {
  bs.bits[i >>> 5] &= ~(ONE >>> (i & 31));
}

/** Mutate a := a & b */
function bitsetAndInPlace(a: BitSet, b: BitSet): void {
  const A = a.bits, B = b.bits;
  const n = Math.min(A.length, B.length);
  for (let i = 0; i < n; i++) A[i] &= B[i];
}

/** Mutate a := a | b */
function bitsetOrInPlace(a: BitSet, b: BitSet): void {
  const A = a.bits, B = b.bits;
  const n = Math.min(A.length, B.length);
  for (let i = 0; i < n; i++) A[i] |= B[i];
}

/** Mutate bs := ~bs (with trailing cleanup) */
function bitsetNotInPlace(bs: BitSet): void {
  const bits = bs.bits;
  const n = bits.length;
  for (let i = 0; i < n; i++) bits[i] = ~bits[i];
  // unset extraneous trailing bits
  const tail = bs.size & 31;
  if (tail) bits[n - 1] &= ONE >> (tail - 1);
}

/** Count number of 1-bits (Kernighan’s popcount) */
function bitsetCount(bs: BitSet): number {
  let count = 0;
  const arr = bs.bits;
  for (let i = 0; i < arr.length; i++) {
    for (let w = arr[i]; w; ++count) w &= (w - 1) >>> 0;
  }
  return count;
}

/** Scan all set bits and call fn(i) */
function bitsetScan(bs: BitSet, fn: (i: number) => void): void {
  for (let i = bitsetNext(bs, 0); i >= 0; i = bitsetNext(bs, i + 1)) fn(i);
}

/** Return the next set bit at or after i, or -1 if none */
function bitsetNext(bs: BitSet, i: number): number {
  const bits = bs.bits;
  const n = bits.length;

  let index = i >>> 5;
  let curr = bits[index] & (ALL >>> (i & 31));

  for (; index < n; curr = bits[++index]) {
    if (curr !== 0) {
      return (index << 5) + Math.clz32(curr);
    }
  }
  return -1;
}

/** Return index of the nth set bit (0-based), or -1 if not found */
function bitsetNth(bs: BitSet, n: number): number {
  let i = bitsetNext(bs, 0);
  while (n-- && i >= 0) i = bitsetNext(bs, i + 1);
  return i;
}

/** Build a BitSet from a Uint8Array mask (non-zero => set).
 *  Packs 32 bytes into each Uint32 word for ~32x fewer operations. */
export function bitsetFromMask(mask: Uint8Array): BitSet {
  const n = mask.length;
  const bs = createBitSet(n);
  const bits = bs.bits;
  const fullWords = n >>> 5;

  for (let w = 0; w < fullWords; w++) {
    const base = w << 5;
    let word = 0;
    // Pack 32 mask bytes into one Uint32 word (MSB-first layout)
    if (mask[base])      word |= 0x80000000;
    if (mask[base + 1])  word |= 0x40000000;
    if (mask[base + 2])  word |= 0x20000000;
    if (mask[base + 3])  word |= 0x10000000;
    if (mask[base + 4])  word |= 0x08000000;
    if (mask[base + 5])  word |= 0x04000000;
    if (mask[base + 6])  word |= 0x02000000;
    if (mask[base + 7])  word |= 0x01000000;
    if (mask[base + 8])  word |= 0x00800000;
    if (mask[base + 9])  word |= 0x00400000;
    if (mask[base + 10]) word |= 0x00200000;
    if (mask[base + 11]) word |= 0x00100000;
    if (mask[base + 12]) word |= 0x00080000;
    if (mask[base + 13]) word |= 0x00040000;
    if (mask[base + 14]) word |= 0x00020000;
    if (mask[base + 15]) word |= 0x00010000;
    if (mask[base + 16]) word |= 0x00008000;
    if (mask[base + 17]) word |= 0x00004000;
    if (mask[base + 18]) word |= 0x00002000;
    if (mask[base + 19]) word |= 0x00001000;
    if (mask[base + 20]) word |= 0x00000800;
    if (mask[base + 21]) word |= 0x00000400;
    if (mask[base + 22]) word |= 0x00000200;
    if (mask[base + 23]) word |= 0x00000100;
    if (mask[base + 24]) word |= 0x00000080;
    if (mask[base + 25]) word |= 0x00000040;
    if (mask[base + 26]) word |= 0x00000020;
    if (mask[base + 27]) word |= 0x00000010;
    if (mask[base + 28]) word |= 0x00000008;
    if (mask[base + 29]) word |= 0x00000004;
    if (mask[base + 30]) word |= 0x00000002;
    if (mask[base + 31]) word |= 0x00000001;
    bits[w] = word >>> 0;
  }

  // Handle remaining bits
  const rem = n & 31;
  if (rem) {
    const base = fullWords << 5;
    let word = 0;
    for (let j = 0; j < rem; j++) {
      if (mask[base + j]) word |= (0x80000000 >>> j);
    }
    bits[fullWords] = word >>> 0;
  }

  return bs;
}

/** Build a BitSet from a list of row indices to set */
function bitsetFromIndex(size: number, idx: Uint32Array): BitSet {
  const bs = createBitSet(size);
  for (let i = 0; i < idx.length; i++) bitsetSet(bs, idx[i]);
  return bs;
}

/** Compact a BitSet to an ordered Uint32Array of set indices */
function bitsetToIndex(bs: BitSet): Uint32Array {
  const out = new Uint32Array(bitsetCount(bs));
  let k = 0;
  bitsetScan(bs, (i) => {
    out[k++] = i;
  });
  return out;
}

// ----------------------------------------------------------------------------
// Build a compact index for the current view (mask wins, then explicit index)
// ----------------------------------------------------------------------------
export function materializeIndex(len: number, view?: View | null): Uint32Array {
  if (!view) {
    return Uint32Array.from({ length: len }, (_, i) => i);
  }
  if (view._materializedIndex) return view._materializedIndex;

  // If we have an explicit index and a mask, filter the index
  if (view.index) {
    if (view.mask) {
      const idx = view.index;
      // Pre-allocate worst case, then slice
      const tmp = new Uint32Array(idx.length);
      let k = 0;
      for (let i = 0; i < idx.length; i++) {
        if (bitsetTest(view.mask, idx[i])) tmp[k++] = idx[i];
      }
      const out = tmp.subarray(0, k);
      return (view._materializedIndex = out);
    }
    return (view._materializedIndex = view.index);
  }

  // If only a mask, compact it
  if (view.mask) {
    const out = bitsetToIndex(view.mask);
    return (view._materializedIndex = out);
  }

  // Fallback: identity
  return (view._materializedIndex = Uint32Array.from(
    { length: len },
    (_, i) => i,
  ));
}
