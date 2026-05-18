import type { DataFrame } from "../types/dataframe.type.ts";
import { type ColumnData, type ColumnarStore } from "./columnar-store.ts";
export declare function withIndex<Row extends object>(df: DataFrame<Row>, index: Uint32Array): DataFrame<Row>;
export declare function withMask<Row extends object>(df: DataFrame<Row>, mask: import("./columnar-view.ts").BitSet): DataFrame<Row>;
export declare function withRawMask<Row extends object>(df: DataFrame<Row>, rawMask: Uint8Array): DataFrame<Row>;
export declare function cowStore(base: ColumnarStore, updates: Partial<Record<string, ColumnData>>, drops?: Set<string>, renames?: Record<string, string>): ColumnarStore;
