// deno-lint-ignore-file no-explicit-any
import type {
  DataFrame,
  GroupedDataFrame,
  Prettify,
} from "../../../dataframe/index.ts";
import type { AddColumns, ColumnValue } from "./mutate.types.ts";
import { shouldUseAsyncForMutate } from "../../../promised-dataframe/index.ts";
import { mutateSyncImpl } from "./mutate-sync.ts";
import { mutateAsyncImpl } from "./mutate-async.ts";
import type { ConcurrencyOptions } from "../../../promised-dataframe/concurrency-utils.ts";

/*
 * IMPORTANT: PromisedDataFrame Overloads Removed From Here
 * ========================================================
 *
 * DISCOVERY: Adding PromisedDataFrame overloads to this file is INEFFECTIVE
 * - The thenable proxy system calls resolveVerb() directly
 * - resolveVerb() bypasses TypeScript's normal overload resolution
 * - Proxy behavior makes these overloads unreachable for PromisedDataFrame
 *
 * SOLUTION: PromisedDataFrame method signatures are now overridden in:
 * src/dataframe/ts/promised-dataframe/types/promised-dataframe.type.ts
 *
 * These overloads below are ONLY for regular DataFrame and GroupedDataFrame.
 * They work normally because they use standard function call resolution.
 */

/* =================================================================================
   Overloads (pipe style). Function-spec overloads come first and use the
   "intersection trick" so we keep inferred return types from the arrow
   functions while enforcing (row, idx, df) parameter types.
   ================================================================================= */

// ---------- GROUPED: object spec of functions (preserve return types) ----------

export function mutate<
  Row extends Record<string, unknown>,
  GroupName extends keyof Row,
  Formulas extends Record<string, (...a: any[]) => any>,
>(
  spec:
    & Formulas
    & {
      [ColName in keyof Formulas]: (
        row: Row,
        idx: number,
        df: DataFrame<Row>,
      ) => ReturnType<Formulas[ColName]>;
    },
): (
  df: GroupedDataFrame<Row, GroupName>,
) => GroupedDataFrame<
  Prettify<
    & Omit<Row, keyof Formulas>
    & { [ColName in keyof Formulas]: ReturnType<Formulas[ColName]> }
  >,
  Extract<
    GroupName,
    keyof Prettify<
      & Omit<Row, keyof Formulas>
      & { [ColName in keyof Formulas]: ReturnType<Formulas[ColName]> }
    >
  >
>;

// ---------- GROUPED: broad MutateExpr fallback ----------

export function mutate<
  Row extends Record<string, unknown>,
  GroupName extends keyof Row,
  Assignments extends Record<string, ColumnValue<Row>>,
>(
  spec: Assignments,
): (
  df: GroupedDataFrame<Row, GroupName>,
) => GroupedDataFrame<
  Prettify<AddColumns<Row, Assignments>>,
  Extract<GroupName, keyof Prettify<AddColumns<Row, Assignments>>>
>;

// ---------- UNGROUPED: object spec of functions (preserve return types) ----------

export function mutate<
  Row extends Record<string, unknown>,
  Formulas extends Record<string, (...a: any[]) => any>,
>(
  spec:
    & Formulas
    & {
      [ColName in keyof Formulas]: (
        row: Row,
        idx: number,
        df: DataFrame<Row>,
      ) => ReturnType<Formulas[ColName]>;
    },
): (
  df: DataFrame<Row>,
) => DataFrame<
  Prettify<
    & Omit<Row, keyof Formulas>
    & { [ColName in keyof Formulas]: ReturnType<Formulas[ColName]> }
  >
>;

// ---------- UNGROUPED: broad MutateExpr fallback ----------

export function mutate<
  Row extends Record<string, unknown>,
  Assignments extends Record<string, ColumnValue<Row>>,
>(
  spec: Assignments,
): (df: DataFrame<Row>) => DataFrame<Prettify<AddColumns<Row, Assignments>>>;

// ---------- ASYNC FUNCTION OVERLOADS (when async functions detected) ----------

// GROUPED - async function overload (returns Promise when async functions detected)
export function mutate<
  Row extends Record<string, unknown>,
  GroupName extends keyof Row,
  Formulas extends Record<
    string,
    | ((row: Row, idx: number, df: DataFrame<Row>) => Promise<unknown>)
    | ((row: Row, idx: number, df: DataFrame<Row>) => unknown)
  >,
>(
  spec:
    & Formulas
    & {
      [K in keyof Formulas]: Formulas[K] extends
        (row: Row, idx: number, df: DataFrame<Row>) => Promise<infer R>
        ? (row: Row, idx: number, df: DataFrame<Row>) => Promise<R>
        : Formulas[K] extends
          (row: Row, idx: number, df: DataFrame<Row>) => infer R
          ? (row: Row, idx: number, df: DataFrame<Row>) => R
        : never;
    },
): (
  df: GroupedDataFrame<Row, GroupName>,
) => Promise<
  GroupedDataFrame<
    Prettify<
      & Omit<Row, keyof Formulas>
      & { [ColName in keyof Formulas]: Awaited<ReturnType<Formulas[ColName]>> }
    >,
    Extract<
      GroupName,
      keyof Prettify<
        & Omit<Row, keyof Formulas>
        & {
          [ColName in keyof Formulas]: Awaited<ReturnType<Formulas[ColName]>>;
        }
      >
    >
  >
>;

// UNGROUPED - async function overload (returns Promise when async functions detected)
export function mutate<
  Row extends Record<string, unknown>,
  Formulas extends Record<
    string,
    | ((row: Row, idx: number, df: DataFrame<Row>) => Promise<unknown>)
    | ((row: Row, idx: number, df: DataFrame<Row>) => unknown)
  >,
>(
  spec:
    & Formulas
    & {
      [K in keyof Formulas]: Formulas[K] extends
        (row: Row, idx: number, df: DataFrame<Row>) => Promise<infer R>
        ? (row: Row, idx: number, df: DataFrame<Row>) => Promise<R>
        : Formulas[K] extends
          (row: Row, idx: number, df: DataFrame<Row>) => infer R
          ? (row: Row, idx: number, df: DataFrame<Row>) => R
        : never;
    },
): (
  df: DataFrame<Row>,
) => Promise<
  DataFrame<
    Prettify<
      & Omit<Row, keyof Formulas>
      & { [ColName in keyof Formulas]: Awaited<ReturnType<Formulas[ColName]>> }
    >
  >
>;

// ---------- OVERLOADS WITH CONCURRENCY OPTIONS ----------

// GROUPED with concurrency options
export function mutate<
  Row extends Record<string, unknown>,
  GroupName extends keyof Row,
  Assignments extends Record<string, ColumnValue<Row>>,
>(
  spec: Assignments,
  options: ConcurrencyOptions,
): (
  df: GroupedDataFrame<Row, GroupName>,
) => Promise<
  GroupedDataFrame<
    Prettify<AddColumns<Row, Assignments>>,
    Extract<GroupName, keyof Prettify<AddColumns<Row, Assignments>>>
  >
>;

// UNGROUPED with concurrency options
export function mutate<
  Row extends Record<string, unknown>,
  Assignments extends Record<string, ColumnValue<Row>>,
>(
  spec: Assignments,
  options: ConcurrencyOptions,
): (
  df: DataFrame<Row>,
) => Promise<DataFrame<Prettify<AddColumns<Row, Assignments>>>>;

/* =================================================================================
   Implementation (broad; overloads give the precise types).
   ================================================================================= */

export function mutate(
  spec: Record<string, any>,
  options?: ConcurrencyOptions,
): any {
  return (df: any): any => {
    if (typeof spec === "object" && spec !== null) {
      // Check if any functions are async OR if concurrency options are provided
      const isAsync = shouldUseAsyncForMutate(df, spec) ||
        (options !== undefined);

      if (isAsync) {
        // Apply default concurrency if no options provided
        // Use DataFrame's options as defaults if available (stored in __options)
        const dfOptions = (df as any).__options || {};
        const concurrencyOptions = options || dfOptions ||
          { concurrency: 10 };
        return mutateAsyncImpl(
          df,
          spec as Record<string, unknown>,
          concurrencyOptions,
        );
      } else {
        return mutateSyncImpl(df, spec as Record<string, unknown>);
      }
    } else {
      throw new TypeError("Invalid arguments to mutate");
    }
  };
}
