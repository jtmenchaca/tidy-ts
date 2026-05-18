/**
 * Shared helper functions for join operations
 */
import type { JoinArgs, StoreAndIndex } from "./types/index.ts";
export declare function getStoreAndIndex(df: any): StoreAndIndex;
export declare function parseJoinArgs(arg2: any, // Can be keys or options
arg3?: any): JoinArgs<any, any>;
export declare function computeSameNamedKeys(leftJoinKeys: string[], rightJoinKeys: string[]): {
    sameNamedLeftKeys: Set<string>;
    sameNamedRightKeys: Set<string>;
};
export declare const NA_U32 = 4294967295;
export declare function computeColumnConflicts(leftColumnNames: string[], rightColumnNames: string[], leftJoinKeys: string[]): {
    leftNameSet: Set<string>;
    rightNameSet: Set<string>;
    leftKeySet: Set<string>;
};
export declare function applySuffixToColumnName(name: string, hasConflict: boolean, suffix: string): string;
export interface JoinIndices {
    leftIdxView: number[];
    rightIdxView: (number | null)[];
}
export interface InnerJoinIndices {
    leftIdxView: number[];
    rightIdxView: number[];
}
export type JoinType = "inner" | "left" | "right" | "outer";
export interface JoinAlgorithmParams {
    leftKeys: readonly unknown[];
    rightKeys: readonly unknown[];
    joinType: JoinType;
    wasmFunctions: {
        i64: (left: BigInt64Array, right: BigInt64Array) => any;
        str: (left: string[], right: string[]) => any;
    };
    threshold?: number;
}
export interface ColumnProcessingParams {
    store: StoreAndIndex;
    baseIndices: Uint32Array;
    columnNames: string[];
    nameSet: Set<string>;
    conflictSet: Set<string>;
    keySet: Set<string>;
    dropKeys: Set<string>;
    suffix: string;
    useNullable?: boolean;
}
export declare function processJoinColumns(params: ColumnProcessingParams): {
    columns: Record<string, unknown[]>;
    names: string[];
};
export interface JoinSetupResult {
    leftStore: StoreAndIndex;
    rightStore: StoreAndIndex;
    leftKeys: string[];
    rightKeys: string[];
    suffixes: {
        left?: string;
        right?: string;
    };
}
export declare function setupJoinOperation(left: any, right: any, byOrOptions: any, options?: {
    suffixes?: {
        left?: string;
        right?: string;
    };
}): JoinSetupResult | null;
export declare function createEmptyJoinResult(): import("../../dataframe/index.ts").DataFrame<object>;
