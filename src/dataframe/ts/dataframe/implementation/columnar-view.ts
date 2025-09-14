// A light, Arquero-style view: keeps a pointer to the column store + optional
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
// Bit constants (same convention as Arquero)
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
export function bitsetTest(bs: BitSet, i: number) {
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
export function bitsetAndInPlace(a: BitSet, b: BitSet): void {
  const A = a.bits, B = b.bits;
  const n = Math.min(A.length, B.length);
  for (let i = 0; i < n; i++) A[i] &= B[i];
}

/** Mutate a := a | b */
export function bitsetOrInPlace(a: BitSet, b: BitSet): void {
  const A = a.bits, B = b.bits;
  const n = Math.min(A.length, B.length);
  for (let i = 0; i < n; i++) A[i] |= B[i];
}

/** Mutate bs := ~bs (with trailing cleanup) */
export function bitsetNotInPlace(bs: BitSet): void {
  const bits = bs.bits;
  const n = bits.length;
  for (let i = 0; i < n; i++) bits[i] = ~bits[i];
  // unset extraneous trailing bits
  const tail = bs.size & 31;
  if (tail) bits[n - 1] &= ONE >> (tail - 1);
}

/** Count number of 1-bits (Kernighan’s popcount) */
export function bitsetCount(bs: BitSet): number {
  let count = 0;
  const arr = bs.bits;
  for (let i = 0; i < arr.length; i++) {
    for (let w = arr[i]; w; ++count) w &= (w - 1) >>> 0;
  }
  return count;
}

/** Scan all set bits and call fn(i) */
export function bitsetScan(bs: BitSet, fn: (i: number) => void): void {
  for (let i = bitsetNext(bs, 0); i >= 0; i = bitsetNext(bs, i + 1)) fn(i);
}

/** Return the next set bit at or after i, or -1 if none */
export function bitsetNext(bs: BitSet, i: number): number {
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
export function bitsetNth(bs: BitSet, n: number): number {
  let i = bitsetNext(bs, 0);
  while (n-- && i >= 0) i = bitsetNext(bs, i + 1);
  return i;
}

/** Build a BitSet from a Uint8Array mask (non-zero => set) */
export function bitsetFromMask(mask: Uint8Array): BitSet {
  const bs = createBitSet(mask.length);
  for (let i = 0; i < mask.length; i++) if (mask[i]) bitsetSet(bs, i);
  return bs;
}

/** Build a BitSet from a list of row indices to set */
export function bitsetFromIndex(size: number, idx: Uint32Array): BitSet {
  const bs = createBitSet(size);
  for (let i = 0; i < idx.length; i++) bitsetSet(bs, idx[i]);
  return bs;
}

/** Compact a BitSet to an ordered Uint32Array of set indices */
export function bitsetToIndex(bs: BitSet): Uint32Array {
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
