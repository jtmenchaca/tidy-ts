import type {
  DataFrame,
  GroupedDataFrame,
  Prettify,
} from "../../../dataframe/index.ts";

/**
 * Expression type for mutateOverGroup: receives a group DataFrame, returns an array.
 */
type GroupExpr<Row extends object> = (df: DataFrame<Row>) => unknown[];

/**
 * Assignments for mutateOverGroup: each value is a function (groupDf) => array.
 */
type GroupAssignments<Row extends object> = Record<string, GroupExpr<Row>>;

/**
 * Compute the result type for a group expression.
 */
type GroupExprResult<Value> = Value extends (
  // deno-lint-ignore no-explicit-any
  df: any,
) => (infer Element)[]
  ? Element
  : unknown;

export interface MutateOverGroupMethod<Row extends object> {
  // Grouped
  <
    R extends object,
    GroupName extends keyof R,
    Assignments extends GroupAssignments<R>,
  >(
    this: GroupedDataFrame<R, GroupName>,
    assignments: Assignments,
  ): GroupedDataFrame<
    Prettify<
      & { [K in keyof R as K extends keyof Assignments ? never : K]: R[K] }
      & { [K in keyof Assignments]: GroupExprResult<Assignments[K]> }
    >,
    Extract<
      GroupName,
      keyof (
        & { [K in keyof R as K extends keyof Assignments ? never : K]: R[K] }
        & { [K in keyof Assignments]: GroupExprResult<Assignments[K]> }
      )
    >
  >;

  // Ungrouped
  <
    R extends object,
    Assignments extends GroupAssignments<R>,
  >(
    this: DataFrame<R>,
    assignments: Assignments,
  ): DataFrame<
    Prettify<
      & { [K in keyof R as K extends keyof Assignments ? never : K]: R[K] }
      & { [K in keyof Assignments]: GroupExprResult<Assignments[K]> }
    >
  >;
}
