import type { ColumnarStore } from "../../../dataframe/index.ts";
export type JoinKey<Row extends object> = Extract<keyof Row, string>;
export type StoreAndIndex = {
    store: ColumnarStore;
    index: Uint32Array;
};
export type ColumnMapping<L extends object, R extends object> = {
    left: Extract<keyof L, string> | readonly Extract<keyof L, string>[];
    right: Extract<keyof R, string> | readonly Extract<keyof R, string>[];
};
export type JoinArgs<L extends object, R extends object> = {
    leftKeys: string[];
    rightKeys: string[];
    suffixes: {
        left?: string;
        right?: string;
    };
};
/** Helper: a minimal "row-like" container that a DataFrame satisfies */
export type DFLike<Row extends object> = {
    readonly nrows: () => number;
    readonly [n: number]: Row;
    [Symbol.iterator](): IterableIterator<Row>;
};
/** Extract row type from a DF-like thing */
export type RowOfLike<X extends DFLike<any>> = X extends {
    readonly [n: number]: infer R;
} ? R : never;
export type JoinSuffixes<L extends string = string, R extends string = string> = {
    left?: L;
    right?: R;
};
export type SimpleJoinOptions = {
    suffixes?: JoinSuffixes;
};
export type ObjectJoinOptions<LeftRow extends object, RightRow extends object, S extends JoinSuffixes<any, any> = JoinSuffixes> = {
    keys: readonly Extract<keyof LeftRow & keyof RightRow, string>[] | {
        left: Extract<keyof LeftRow, string> | readonly Extract<keyof LeftRow, string>[];
        right: Extract<keyof RightRow, string> | readonly Extract<keyof RightRow, string>[];
    };
    suffixes?: S;
};
export type JoinOptions<LeftRow extends object = object, RightRow extends object = object> = SimpleJoinOptions | ObjectJoinOptions<LeftRow, RightRow>;
