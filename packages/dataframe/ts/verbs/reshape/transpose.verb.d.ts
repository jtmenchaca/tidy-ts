/**
 * Symbol-based transpose: uses ROW_LABEL symbol column for reversible transposes.
 *
 * Two cases:
 * 1. DataFrame has ROW_LABEL column: use its values as new column names
 * 2. DataFrame has no ROW_LABEL column: generate row_0, row_1, ... column names
 *
 * Always creates a new ROW_LABEL column containing the original column names.
 * This makes transpose truly reversible with zero column name conflicts.
 */
export declare function transpose({ numberOfRows: _numberOfRows }: {
    numberOfRows?: number;
}): (df: any) => any;
