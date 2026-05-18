/**
 * Shared helper utilities used across multiple verb implementations.
 */
import { type BitSet } from "../dataframe/implementation/columnar-view.ts";
import { type ColumnData, type ColumnarStore } from "../dataframe/implementation/columnar-store.ts";
/**
 * Lightweight row cursor that provides property-getter access to columnar data.
 * Used internally by verbs that rebuild stores and need to attach a new __rowView.
 *
 * For mutate operations that add columns dynamically, pass `configurable: true`
 * so that property definitions can be overwritten when new columns are added.
 */
export declare class RowView {
    private cols;
    private _i;
    constructor(cols: Record<string, ColumnData>, names: string[], configurable?: boolean);
    setCursor(i: number): void;
}
/** Wrap a RowView in a Proxy that throws on unknown column access. */
export declare function wrapRowView(view: RowView, names: string[]): RowView;
/**
 * Build a new DataFrame from a columnar store by selecting rows at the given
 * physical indices. Returns the DataFrame with __view reset and __rowView attached.
 */
export declare function buildDataFrameFromIndices(store: ColumnarStore, indices: number[]): any;
/**
 * Compare two values with null-safe, type-aware logic.
 * Nulls always sort to the end regardless of direction.
 *
 * Type cascade: null → number → Date → Comparable → string (localeCompare).
 */
export declare function compareValues(a: unknown, b: unknown, direction?: "asc" | "desc"): number;
/**
 * Collect row indices for a single group from the adjacency list,
 * filtering by mask if present.
 *
 * Returns view-level indices (not physical store indices). If you need
 * physical indices, remap through `baseIndex` afterward.
 */
export declare function collectGroupIndices({ head, next, groupIndex, mask, rawMask, }: {
    head: Int32Array;
    next: Int32Array;
    groupIndex: number;
    mask?: BitSet | null;
    rawMask?: Uint8Array | null;
}): number[];
/**
 * Collect **physical store indices** for a single group.
 *
 * When `usesRawIndices` is true (no view), adjacency list values are already
 * physical indices. Otherwise they are view-level offsets that must be
 * remapped through `baseIndex`.
 *
 * Unlike `collectGroupIndices`, this does NOT re-filter by mask/rawMask
 * because `groupBy` already built the adjacency list from only visible rows.
 */
export declare function collectGroupPhysicalIndices({ head, next, groupIndex, usesRawIndices, baseIndex, }: {
    head: Int32Array;
    next: Int32Array;
    groupIndex: number;
    usesRawIndices: boolean;
    baseIndex: Uint32Array | null;
}): number[];
