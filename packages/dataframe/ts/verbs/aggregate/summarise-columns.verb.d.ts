/**
 * Summarise across multiple columns of the same type.
 *
 * Applies aggregation functions to entire columns (group-level operations)
 * across multiple columns of the same type. Creates new columns for each
 * function x input-column combination.
 */
export declare function summarise_columns(spec: any): (df: any) => any;
