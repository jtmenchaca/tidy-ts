// deno-lint-ignore-file no-explicit-any
import type {
  DataFrame,
  GroupedDataFrame,
} from "../../../dataframe/index.ts";
import type {
  ColumnValue,
  ColumnValueResult,
  MutateAssignments,
} from "./mutate.types.ts";
import { mutateSyncImpl } from "./mutate-sync.ts";
import { mutateAsyncImpl } from "./mutate-async.ts";
import type { ConcurrencyOptions } from "../../../promised-dataframe/concurrency-utils.ts";

/*
 * IMPORTANT: PromisedDataFrame Overloads Not Here
 * ================================================
 *
 * The thenable proxy system calls resolveVerb() directly, bypassing TypeScript's
 * normal overload resolution. PromisedDataFrame method signatures are overridden in:
 * packages/dataframe/ts/promised-dataframe/types/promised-dataframe.type.ts
 *
 * These overloads below are ONLY for regular DataFrame and GroupedDataFrame.
 */

/* =================================================================================
  mutate — synchronous only. Use mutateAsync for async formulas.
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
  {
    [K in keyof Row | keyof Formulas]:
      K extends keyof Formulas ? ReturnType<Formulas[K]>
        : K extends keyof Row ? Row[K]
        : never;
  },
  Extract<GroupName, keyof Row | keyof Formulas>
>;

// ---------- GROUPED: broad MutateExpr fallback (functions | arrays | null) ----------

export function mutate<
  Row extends Record<string, unknown>,
  GroupName extends keyof Row,
  Assignments extends Record<string, ColumnValue<Row>>,
>(
  spec: Assignments,
): (
  df: GroupedDataFrame<Row, GroupName>,
) => GroupedDataFrame<
  {
    [K in keyof Row | keyof Assignments]:
      K extends keyof Assignments ? ColumnValueResult<Row, Assignments[K]>
        : K extends keyof Row ? Row[K]
        : never;
  },
  Extract<GroupName, keyof Row | keyof Assignments>
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
  {
    [K in keyof Row | keyof Formulas]:
      K extends keyof Formulas ? ReturnType<Formulas[K]>
        : K extends keyof Row ? Row[K]
        : never;
  }
>;

// ---------- UNGROUPED: broad MutateExpr fallback (functions | arrays | null) ----------

export function mutate<
  Row extends Record<string, unknown>,
  Assignments extends Record<string, ColumnValue<Row>>,
>(
  spec: Assignments,
): (df: DataFrame<Row>) => DataFrame<
  {
    [K in keyof Row | keyof Assignments]:
      K extends keyof Assignments ? ColumnValueResult<Row, Assignments[K]>
        : K extends keyof Row ? Row[K]
        : never;
  }
>;

/* =================================================================================
  mutate implementation — sync only. Use mutateAsync for async functions.
  ================================================================================= */

export function mutate(
  spec: Record<string, any>,
): any {
  return (df: any): any => {
    if (typeof spec === "object" && spec !== null) {
      return mutateSyncImpl(
        df,
        spec as MutateAssignments<Record<string, unknown>>,
      );
    } else {
      throw new TypeError("Invalid arguments to mutate");
    }
  };
}

/* =================================================================================
  mutateAsync — always async. Returns Promise, wrapped by resolveVerb into
  thenableDataFrame for PromisedDataFrame chaining.
  ================================================================================= */

// ---------- GROUPED: async function overload ----------

export function mutateAsync<
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
  options?: ConcurrencyOptions,
): (
  df: GroupedDataFrame<Row, GroupName>,
) => Promise<
  GroupedDataFrame<
    {
      [K in keyof Row | keyof Formulas]:
        K extends keyof Formulas ? Awaited<ReturnType<Formulas[K]>>
          : K extends keyof Row ? Row[K]
          : never;
    },
    Extract<GroupName, keyof Row | keyof Formulas>
  >
>;

// ---------- UNGROUPED: async function overload ----------

export function mutateAsync<
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
  options?: ConcurrencyOptions,
): (
  df: DataFrame<Row>,
) => Promise<
  DataFrame<
    {
      [K in keyof Row | keyof Formulas]:
        K extends keyof Formulas ? Awaited<ReturnType<Formulas[K]>>
          : K extends keyof Row ? Row[K]
          : never;
    }
  >
>;

// ---------- GROUPED: broad assignment fallback ----------

export function mutateAsync<
  Row extends Record<string, unknown>,
  GroupName extends keyof Row,
  Assignments extends Record<string, ColumnValue<Row>>,
>(
  spec: Assignments,
  options?: ConcurrencyOptions,
): (
  df: GroupedDataFrame<Row, GroupName>,
) => Promise<
  GroupedDataFrame<
    {
      [K in keyof Row | keyof Assignments]:
        K extends keyof Assignments ? ColumnValueResult<Row, Assignments[K]>
          : K extends keyof Row ? Row[K]
          : never;
    },
    Extract<GroupName, keyof Row | keyof Assignments>
  >
>;

// ---------- UNGROUPED: broad assignment fallback ----------

export function mutateAsync<
  Row extends Record<string, unknown>,
  Assignments extends Record<string, ColumnValue<Row>>,
>(
  spec: Assignments,
  options?: ConcurrencyOptions,
): (
  df: DataFrame<Row>,
) => Promise<
  DataFrame<
    {
      [K in keyof Row | keyof Assignments]:
        K extends keyof Assignments ? ColumnValueResult<Row, Assignments[K]>
          : K extends keyof Row ? Row[K]
          : never;
    }
  >
>;

/* =================================================================================
  mutateAsync implementation
  ================================================================================= */

export function mutateAsync(
  spec: Record<string, any>,
  options?: ConcurrencyOptions,
): any {
  return (df: any): any => {
    if (typeof spec === "object" && spec !== null) {
      const dfOptions = (df as any).__options || {};
      const concurrencyOptions = options || dfOptions || { concurrency: 10 };
      return mutateAsyncImpl(
        df,
        spec as MutateAssignments<Record<string, unknown>>,
        concurrencyOptions,
      );
    } else {
      throw new TypeError("Invalid arguments to mutateAsync");
    }
  };
}
