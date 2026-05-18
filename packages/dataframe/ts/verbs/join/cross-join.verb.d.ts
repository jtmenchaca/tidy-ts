/**
 * Cross join: create Cartesian product of all rows.
 */
export declare function cross_join(right: any, maxRows?: number, suffixes?: {
    left?: string;
    right?: string;
}): (left: any) => any;
