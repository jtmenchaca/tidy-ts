// Core join types and utilities
import type {
  ColumnarStore,
  MakeUndefined,
  Prettify,
} from "../../../dataframe/index.ts";

// -----------------------------------------------------------------------------
// Basic Types
// -----------------------------------------------------------------------------

export type JoinKey<Row extends object> = Extract<
  keyof Row,
  string
>;

export type StoreAndIndex = { store: ColumnarStore; index: Uint32Array };

// Import type for column mapping
export type ColumnMapping<
  L extends object,
  R extends object,
> = {
  left: Extract<keyof L, string> | readonly Extract<keyof L, string>[];
  right: Extract<keyof R, string> | readonly Extract<keyof R, string>[];
};

// Parse join arguments from either API style
export type JoinArgs<
  L extends object,
  R extends object,
> = {
  leftKeys: string[];
  rightKeys: string[];
  suffixes: { left?: string; right?: string };
};

// -----------------------------------------------------------------------------
// Row Result Types (backwards compatibility)
// -----------------------------------------------------------------------------

// For single key joins (backwards compatibility)
export type RowAfterInnerJoin<
  LeftRow extends object,
  RightRow extends object,
> = Prettify<LeftRow & Omit<RightRow, keyof LeftRow & keyof RightRow>>;

export type RowAfterLeftJoin<
  LeftRow extends object,
  RightRow extends object,
> = Prettify<
  LeftRow & MakeUndefined<Omit<RightRow, keyof LeftRow & keyof RightRow>>
>;

export type RowAfterRightJoin<
  LeftRow extends object,
  RightRow extends object,
> = Prettify<
  MakeUndefined<Omit<LeftRow, keyof LeftRow & keyof RightRow>> & RightRow
>;

export type RowAfterOuterJoin<
  LeftRow extends object,
  RightRow extends object,
> = Prettify<
  & MakeUndefined<Omit<LeftRow, keyof LeftRow & keyof RightRow>>
  & MakeUndefined<Omit<RightRow, keyof LeftRow & keyof RightRow>>
  & Pick<LeftRow, keyof LeftRow & keyof RightRow>
>;

export type RowAfterCrossJoin<
  LeftRow extends object,
  RightRow extends object,
> = Prettify<LeftRow & RightRow>;

export type RowAfterAsofJoin<
  LeftRow extends object,
  RightRow extends object,
  JoinKey extends keyof LeftRow & keyof RightRow = never,
> = Prettify<
  & LeftRow
  & MakeUndefined<Omit<RightRow, keyof LeftRow & keyof RightRow>>
  & MakeUndefined<
    {
      [
        K in Exclude<keyof LeftRow & keyof RightRow, JoinKey> as `${Extract<
          K,
          string
        >}_y`
      ]: RightRow[K];
    }
  >
>;

// -----------------------------------------------------------------------------
// Join Options
// -----------------------------------------------------------------------------

/** Helper: a minimal "row-like" container that a DataFrame satisfies */
export type DFLike<Row extends object> = {
  readonly nrows: () => number;
  readonly [n: number]: Row;
  [Symbol.iterator](): IterableIterator<Row>;
};

/** Extract row type from a DF-like thing */
// deno-lint-ignore no-explicit-any
export type RowOfLike<X extends DFLike<any>> = X extends
  { readonly [n: number]: infer R } ? R : never;

// Basic suffix options (backwards compatible) - now generic to preserve literals
export type JoinSuffixes<
  L extends string = string,
  R extends string = string,
> = {
  left?: L;
  right?: R;
};

// Simple join options (current API)
export type SimpleJoinOptions = {
  suffixes?: JoinSuffixes;
};

// Object-based join options (new advanced API) - generic suffixes to preserve literals
export type ObjectJoinOptions<
  LeftRow extends object,
  RightRow extends object,
  // deno-lint-ignore no-explicit-any
  S extends JoinSuffixes<any, any> = JoinSuffixes,
> = {
  keys:
    | readonly Extract<keyof LeftRow & keyof RightRow, string>[] // Same column names: ["id", "year"] - readonly preserves tuples
    | {
      left:
        | Extract<keyof LeftRow, string>
        | readonly Extract<keyof LeftRow, string>[];
      right:
        | Extract<keyof RightRow, string>
        | readonly Extract<keyof RightRow, string>[];
    }; // Different names: { left: ["emp_id"], right: ["id"] }
  suffixes?: S; // Retains literal types
};

// Union type for all join options (discriminated by structure)
export type JoinOptions<
  LeftRow extends object = object,
  RightRow extends object = object,
> = SimpleJoinOptions | ObjectJoinOptions<LeftRow, RightRow>;
