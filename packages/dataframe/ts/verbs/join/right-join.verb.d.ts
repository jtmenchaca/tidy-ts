/**
 * Right join: keep all rows from right; fill left columns with undefined if no matching key.
 * Columnar-first; respects DataFrame views/masks/orders.
 */
export declare function right_join(right: any, byOrOptions: any, options?: any): (left: any) => any;
