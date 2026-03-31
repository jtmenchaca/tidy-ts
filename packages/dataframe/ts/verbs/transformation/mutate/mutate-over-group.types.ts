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

/**
 * Row type after applying mutateOverGroup assignments.
 */
type RowAfterGroupMutation<
  Row extends object,
  // deno-lint-ignore no-explicit-any
  Assignments extends Record<string, any>,
> = Prettify<
  & { [K in keyof Row as K extends keyof Assignments ? never : K]: Row[K] }
  & { [K in keyof Assignments]: GroupExprResult<Assignments[K]> }
>;

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
    RowAfterGroupMutation<R, Assignments>,
    Extract<GroupName, keyof RowAfterGroupMutation<R, Assignments>>
  >;

  // Ungrouped
  <
    R extends object,
    Assignments extends GroupAssignments<R>,
  >(
    this: DataFrame<R>,
    assignments: Assignments,
  ): DataFrame<RowAfterGroupMutation<R, Assignments>>;
}
