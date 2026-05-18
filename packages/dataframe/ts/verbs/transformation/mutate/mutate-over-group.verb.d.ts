/**
 * Group-level mutate: each expression receives the group DataFrame and returns an array.
 * Called once per group (O(N) not O(N²)).
 *
 * On ungrouped DataFrames, the whole df is treated as one group.
 *
 * Expressions are evaluated sequentially — later expressions can reference
 * columns created by earlier expressions in the same call.
 *
 * @example
 * ```ts
 * df.groupBy("id")
 *   .mutateOverGroup({
 *     maxEndSoFar: (gdf) => s.cummax(gdf.extract("end")),
 *   })
 *   .mutateOverGroup({
 *     prevMaxEnd: (gdf) => s.lag(gdf.extract("maxEndSoFar"), 1),
 *   })
 * ```
 */
export declare function mutateOverGroup(spec: Record<string, (df: any) => unknown[]>): (df: any) => any;
