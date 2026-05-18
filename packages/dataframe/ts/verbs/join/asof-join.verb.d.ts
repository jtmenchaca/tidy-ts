export declare function asof_join(right: any, by: any, opts?: {
    direction?: "backward" | "forward" | "nearest";
    tolerance?: number;
    group_by?: string[];
    suffixes?: {
        left?: string;
        right?: string;
    };
}): (left: any) => any;
