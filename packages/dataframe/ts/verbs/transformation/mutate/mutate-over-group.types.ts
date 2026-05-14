import type {
  DataFrame,
  GroupedDataFrame,
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
    {
      [K in keyof R | keyof Assignments]:
        K extends keyof Assignments ? GroupExprResult<Assignments[K]>
          : K extends keyof R ? R[K]
          : never;
    },
    Extract<GroupName, keyof R | keyof Assignments>
  >;

  // Ungrouped
  <
    R extends object,
    Assignments extends GroupAssignments<R>,
  >(
    this: DataFrame<R>,
    assignments: Assignments,
  ): DataFrame<
    {
      [K in keyof R | keyof Assignments]:
        K extends keyof Assignments ? GroupExprResult<Assignments[K]>
          : K extends keyof R ? R[K]
          : never;
    }
  >;
}
