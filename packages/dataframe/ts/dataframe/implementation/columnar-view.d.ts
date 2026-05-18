export type BitSet = {
    bits: Uint32Array;
    size: number;
};
export type View = {
    index?: Uint32Array | null;
    mask?: BitSet | null;
    rawMask?: Uint8Array | null;
    _materializedIndex?: Uint32Array | null;
    _order?: (ai: number, bi: number, cols: Record<string, unknown[]>) => number;
};
/** Create an empty bitset for n rows. */
export declare function createBitSet(n: number): BitSet;
/** Set bit i. */
export declare function bitsetSet(bs: BitSet, i: number): void;
/** Alias used by call sites: get bit i (boolean). */
export declare function bitsetGet(bs: BitSet, i: number): boolean;
/** Clear bit i. */
export declare function bitsetClear(bs: BitSet, i: number): void;
/** Build a BitSet from a Uint8Array mask (non-zero => set).
 *  Packs 32 bytes into each Uint32 word for ~32x fewer operations. */
export declare function bitsetFromMask(mask: Uint8Array): BitSet;
export declare function materializeIndex(len: number, view?: View | null): Uint32Array;
