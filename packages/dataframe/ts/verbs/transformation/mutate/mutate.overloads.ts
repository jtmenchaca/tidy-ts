// deno-lint-ignore-file no-explicit-any
import type {
  DataFrame,
  GroupedDataFrame,
  Prettify,
} from "../../../dataframe/index.ts";
import type {
  AddColumns,
  ColumnValue,
  MutateAssignments,
} from "./mutate.types.ts";
import { shouldUseAsyncForMutate } from "../../../promised-dataframe/index.ts";
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
  mutate — synchronous only. Rejects async formulas at the type level via AllSync.
  At runtime, uses shouldUseAsyncForMutate as a safety net.
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
  AddColumns<Row, Assignments>,
  Extract<GroupName, keyof AddColumns<Row, Assignments>>
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

// ---------- UNGROUPED: broad MutateExpr fallback (functions | arrays | null) ----------

export function mutate<
  Row extends Record<string, unknown>,
  Assignments extends Record<string, ColumnValue<Row>>,
>(
  spec: Assignments,
): (df: DataFrame<Row>) => DataFrame<AddColumns<Row, Assignments>>;

/* =================================================================================
  mutate implementation — sync by default, async as safety net.
  ================================================================================= */

export function mutate(
  spec: Record<string, any>,
): any {
  return (df: any): any => {
    if (typeof spec === "object" && spec !== null) {
      // Safety net: if user accidentally passes async to mutate(), still handle it
      const isAsync = shouldUseAsyncForMutate(df, spec);
      if (isAsync) {
        return mutateAsyncImpl(
          df,
          spec as MutateAssignments<Record<string, unknown>>,
          { concurrency: 10 },
        );
      }
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
    Prettify<
      & Omit<Row, keyof Formulas>
      & { [ColName in keyof Formulas]: Awaited<ReturnType<Formulas[ColName]>> }
    >
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
    AddColumns<Row, Assignments>,
    Extract<GroupName, keyof AddColumns<Row, Assignments>>
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
) => Promise<DataFrame<AddColumns<Row, Assignments>>>;

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
