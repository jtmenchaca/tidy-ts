import type { DataFrame } from "../../dataframe/index.ts";
export declare function dpareto({ at, scale, shape, returnLog, }: {
    at: number;
    scale: number;
    shape: number;
    returnLog?: boolean;
}): number;
export declare function ppareto({ at, scale, shape, direction, returnLog, }: {
    at: number;
    scale: number;
    shape: number;
    direction?: "below" | "above";
    returnLog?: boolean;
}): number;
export declare function qpareto({ probability, scale, shape, direction, probabilityIsLog, }: {
    probability: number;
    scale: number;
    shape: number;
    direction?: "below" | "above";
    probabilityIsLog?: boolean;
}): number;
export declare function rpareto({ scale, shape, }: {
    scale: number;
    shape: number;
}): number;
export declare function rpareto({ scale, shape, sampleSize, }: {
    scale: number;
    shape: number;
    sampleSize: number;
}): number[];
export declare function paretoData({ scale, shape, type, range, points, }: {
    scale: number;
    shape: number;
    type: "pdf";
    range?: [number, number];
    points?: number;
}): DataFrame<{
    x: number;
    density: number;
}>;
export declare function paretoData({ scale, shape, type, range, points, }: {
    scale: number;
    shape: number;
    type: "cdf";
    range?: [number, number];
    points?: number;
}): DataFrame<{
    x: number;
    probability: number;
}>;
export declare function paretoData({ scale, shape, type, range, points, }: {
    scale: number;
    shape: number;
    type: "inverse_cdf";
    range?: [number, number];
    points?: number;
}): DataFrame<{
    probability: number;
    quantile: number;
}>;
